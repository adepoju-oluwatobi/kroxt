# kroxt

A framework-agnostic, modular authentication engine for modern TypeScript applications. Built for security, extensibility, and ease of use.

## Features

- 🔐 **Secure Hashing**: Powered by `argon2` for industry-standard password security.
- 🎟️ **Dual-Token Sessions**: Native support for Access and Refresh tokens via `jose`.
- 🌍 **OAuth Ready**: Built-in support for GitHub and Google OAuth via `arctic`.
- 🧩 **Database Agnostic**: Use Mongoose, Prisma, Drizzle, or any store via the `AuthAdapter` pattern.
- 🌶️ **Password Peppering**: Server-side pepper support for enhanced hash protection.
- 🛡️ **Timing Attack Protection**: Built-in safeguards against side-channel analysis during login.
- ✅ **Zod Schema Support**: Perfectly preserves and types your user metadata.
- 🚀 **ESM First**: Native support for NodeNext module resolution.

## Installation

```bash
npm install kroxt
```

---

## Guide: Full Authentication Flow

This guide walks you through setting up Kroxt from scratch in your application.

### Step 1: The Adapter Pattern

Kroxt doesn't care which database you use. You just need to implement the `AuthAdapter` interface. 

In this example, we use a simple user structure: `name`, `email`, and `password`.
> [!NOTE]
> Kroxt's adapter can accept **any** additional fields your application requires (e.g., `role`, `avatar`, `preferences`) with no limits.

```typescript
import type { AuthAdapter, User } from "kroxt/adapter";

export const myAdapter: AuthAdapter = {
  createUser: async (data) => {
    // Save to your DB: { name, email, passwordHash, ...anyOtherFields }
    // return the created user including its unique id
  },
  findUserByEmail: async (email) => {
    // Find user by email in your DB
  },
  findUserById: async (id) => {
    // Find user by ID in your DB
  },
  linkOAuthAccount: async (user, provider, providerId) => {
    // Link an OAuth provider to an existing user
  }
};
```

### Step 2: Initialize the Auth Engine

Configure Kroxt with your adapter and security settings.

```typescript
import { createAuth } from "kroxt";
import { myAdapter } from "./myAdapter.js";

export const auth = createAuth({
  adapter: myAdapter,
  secret: process.env.AUTH_SECRET, // High-entropy secret for JWT signing
  pepper: process.env.AUTH_PEPPER, // Optional: Server-side pepper for password hashing
  session: {
    expires: "15m",        // Access token duration
    refreshExpires: "7d"   // Refresh token duration
  }
});
```

### Step 3: Implement Controllers & Routes

Use the engine in your application logic. Examples below use an Express-like structure.

#### Registration
```typescript
app.post("/register", async (req, res) => {
  const { name, email, password, ...extraFields } = req.body;
  
  // Kroxt handles argon2 hashing (with pepper) and token generation
  const { user, accessToken, refreshToken } = await auth.signup({
    name,
    email,
    ...extraFields
  }, password);

  res.json({ user, accessToken, refreshToken });
});
```

#### Login
```typescript
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Kroxt verifies password (timing-attack safe) and returns tokens
  const { user, accessToken, refreshToken } = await auth.loginWithPassword(email, password);

  res.json({ user, accessToken, refreshToken });
});
```

#### Token Refresh
Keep users logged in by rotating access tokens using a valid refresh token.
```typescript
app.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  
  // Returns a fresh access token
  const { accessToken } = await auth.refresh(refreshToken);
  
  res.json({ accessToken });
});
```

#### Protecting Routes (Middleware)
```typescript
app.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  // Verify the JWT and get the payload { sub: string, role: string, ... }
  const payload = await auth.verifyToken(token, "access");
  
  if (!payload) return res.status(401).send("Unauthorized");
  
  const user = await myAdapter.findUserById(payload.sub);
  res.json(user);
});
```

---

## Security Best Practices

### 1. Password Peppering
Always use a `pepper` in production. It's a server-side secret added to passwords before hashing. If your database is leaked, the hashes cannot be cracked without this pepper.

### 2. CSRF Protection
Kroxt provides helpers for the double-submit cookie pattern. Use these if you are storing tokens in cookies.

```typescript
import { generateCsrfToken, verifyCsrf } from "kroxt/security";

const token = generateCsrfToken();
const isValid = verifyCsrf(tokenInRequest, tokenInCookie);
```

### 3. Secure Cookies
If using cookies, always set these flags:
- `httpOnly: true` (Prevents XSS)
- `secure: true` (Requires HTTPS)
- `sameSite: 'strict'` (Prevents CSRF)

### 4. Rate Limiting
Implement rate limiting (e.g., `express-rate-limit`) on `/login` and `/register` to block brute-force attempts.

---

## Reference Project

Check out the `kroxt-example` folder or the [GitHub repository](https://github.com/adepoju-oluwatobi/kroxt-example) for a complete **Express + MongoDB** implementation using this library.

## License

MIT
