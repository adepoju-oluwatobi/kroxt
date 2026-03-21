# kroxt

A framework-agnostic, modular authentication engine for modern TypeScript applications. Built for security, extensibility, and ease of use.

## Features

- 🔐 **Secure Hashing**: Powered by `argon2` for industry-standard password security.
- 🎟️ **Dual-Token Sessions**: Native support for Access and Refresh tokens via `jose`.
- 🧩 **JWT Customization**: Fully extensible payload with support for custom user fields and `sub` override.
- 🌍 **OAuth Ready**: Built-in support for GitHub and Google OAuth via `arctic`.
- 🔌 **Built-in Adapters**: Native, one-line support for **MongoDB (Mongoose)** and **In-Memory** stores.
- 🧩 **Database Agnostic**: Use Prisma, Drizzle, or any store via the generic `AuthAdapter` pattern.
- 🌶️ **Password Peppering**: Server-side pepper support for enhanced hash protection.
- 🛡️ **Timing Attack Protection**: Built-in safeguards against side-channel analysis during login.
- ✅ **Zod Schema Support**: Perfectly preserves and types your user metadata.
- 🌍 **Dual ESM/CJS Support**: Native support for both modern ESM (`import`) and CommonJS (`require`).

## Installation

```bash
npm install kroxt
```

---

## Guide: Full Authentication Flow

This guide walks you through setting up Kroxt from scratch in your application.

### Step 1: Define your User

First, define what a User looks like in your system. Kroxt allows any additional fields (like `role`, `schoolId`, etc.) which you can later sign into your JWTs.

```typescript
export interface MyUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  schoolId: string;    // Custom field for enterprise/multi-tenant apps
  oauthProvider?: string; // Support for OAuth (e.g., 'github')
  oauthId?: string;       // Unique ID from the provider
  name: string;
}
```

### Step 2: Choose an Adapter

Kroxt provides built-in adapters for popular databases. For MongoDB, simply pass your Mongoose model to `createMongoAdapter`.

```typescript
import { createMongoAdapter } from "kroxt/adapters/mongoose";
import { User } from "./models/user.model.js"; // Your Mongoose model

// One line to connect your DB
export const authAdapter = createMongoAdapter(User);
```

> [!TIP]
> Need to use Prisma, Drizzle, or a custom API? You can still build a [Custom Adapter](#custom-adapters).

### Step 3: Initialize the Auth Engine

Configure Kroxt with your adapter and security settings.

```typescript
import { createAuth } from "kroxt/core";
import { authAdapter } from "./auth.js";

export const auth = createAuth({
  adapter: authAdapter,
  secret: process.env.AUTH_SECRET, // High-entropy secret for JWT signing
  pepper: process.env.AUTH_PEPPER, // Optional: Server-side pepper for password hashing
  session: {
    expires: "15m",        // Access token duration
    refreshExpires: "7d"   // Refresh token duration
  },
  jwt: {
    /**
     * Optional: Fully customize the JWT payload or add extra fields.
     */
    payload: (user, type) => {
      // Only add extra details to 'access' tokens to keep 'refresh' tokens light.
      if (type === "access") {
        return {
          schoolId: user.schoolId, // Add custom user detail
          role: user.role,         // Explicitly include role
        };
      }
      return {}; // Refresh tokens stay minimal
    }
  }
});
```

### Step 4: Implement Controllers & Routes

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

## Custom Adapters

Kroxt's true power lies in its database-agnostic design. If you aren't using a built-in adapter, simply implement the `AuthAdapter` interface.

```typescript
import type { AuthAdapter, User } from "kroxt/adapters";
import { db } from "./db.js";

// Example using a generic DB client
export const myCustomAdapter: AuthAdapter<MyUser> = {
  createUser: async (data) => {
    const user = await db.users.insert(data);
    return { ...user, id: user.id.toString() };
  },
  findUserByEmail: async (email) => {
    return await db.users.findFirst({ where: { email } });
  },
  findUserById: async (id) => {
    return await db.users.findUnique({ where: { id } });
  },
  linkOAuthAccount: async (id, provider, providerId) => {
    await db.users.update({
      where: { id },
      data: { oauthProvider: provider, oauthId: providerId }
    });
  }
};
```

Using this pattern, you can connect Kroxt to **Supabase**, **Firestore**, **PostgreSQL**, or even a 3rd-party API.

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
