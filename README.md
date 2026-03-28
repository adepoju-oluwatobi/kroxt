# Kroxt

**The Obsidian Authentication Engine.**

A premium, framework-agnostic, and security-hardened authentication library for modern TypeScript environments. Designed for 100% schema control and "Zero-Config" onboarding.

[![npm version](https://img.shields.io/npm/v/kroxt.svg)](https://www.npmjs.com/package/kroxt)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ 30-Second Onboarding

The recommended way to start is the **Kroxt CLI**. It detects your framework (Next.js, Express, Fastify) and scaffolds a professional auth structure automatically.

```bash
npx kroxt init
```

---

## 🏗️ Core Architecture

Kroxt is "Headless." It provides the **Brain** (Logic, Hashing, JWTs, Security) while you provide the **Face** (UI/Routes). 

### 1. The Configuration Matrix
Every feature in Kroxt is modular. Toggle security layers with a single boolean.

```typescript
import { createAuth } from "kroxt";
import { createMongoAdapter } from "kroxt/adapters/mongoose";

export const auth = createAuth({
  adapter: createMongoAdapter(UserModel),
  secret: process.env.JWT_SECRET,
  
  // Security Layer 1: Sessions
  session: {
    expires: "15m",           // Access Token duration
    refreshExpires: "7d",     // Refresh Token duration
    enforceStrictRevocation: true, // DB-lookup on EVERY request (Admin-mode)
  },

  // Security Layer 2: Defense
  rateLimit: {
    max: 100,                 // Requests per window
    windowMs: 60 * 1000       // 1 Minute window
  },

  // Security Layer 3: Brute Force
  ipBlocking: {
    maxStrikes: 5,            // Ban after 5 failures
    blockDurationMs: 15 * 60 * 1000 // 15 Min ban
  },

  // Security Layer 4: Crypto
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireSpecialCharacter: true,
    usePepper: true           // Requires JWT_PEPPER env variable
  }
});
```

---

## 🔌 Universal Adapters

Bring your own schema. Kroxt adapts to you.

### Mongoose (MongoDB)
```typescript
import { createMongoAdapter } from "kroxt/adapters/mongoose";
const adapter = createMongoAdapter(User); 
```

### Prisma (SQL)
```typescript
import { createPrismaAdapter } from "kroxt/adapters/prisma";
const adapter = createPrismaAdapter(prisma.user);
```

### Drizzle (SQL)
```typescript
import { createDrizzleAdapter } from "kroxt/adapters/drizzle";
import { eq } from "drizzle-orm";
const adapter = createDrizzleAdapter(db, users, eq);
```

### Memory (Testing)
```typescript
import { createMemoryAdapter } from "kroxt";
const adapter = createMemoryAdapter();
```

---

## 🧠 API Reference

### `auth.signup(userData, password)`
Registers a new user. User data is strictly typed to your schema.
```typescript
const { user, accessToken, refreshToken } = await auth.signup({ 
  email: "dev@kroxt.io",
  role: "admin" 
}, "secure_password");
```

### `auth.loginWithPassword(email, password, clientIp?)`
Authenticates a user and generates tokens. Pass `clientIp` to enable IP-Blocking.
```typescript
const result = await auth.loginWithPassword(email, password, req.ip);
```

### `auth.refreshSession(refreshToken, clientIp?)`
Rotates the session. If `enforceStrictRevocation` is on, it validates the token against the user's current password hash.
```typescript
const { user, accessToken, refreshToken: newRefresh } = await auth.refreshSession(token);
```

### `auth.logout(refreshToken)`
Invalidates a session.
```typescript
await auth.logout(refreshToken);
```

### `auth.changePassword(userId, newPassword)`
Updates password and **instantly invalidates all other active sessions** globally via Hash-Linked revocation.
```typescript
await auth.changePassword(user.id, "new_secure_pass");
```

---

## 🧩 Middleware Implementation

### Express / Fastify
```typescript
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const session = await auth.verifyAccessToken(token);
    req.user = session.user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
```

---

## 🚀 Advanced Deployment

### Custom JWT Payloads
Inject metadata into your tokens safely.
```typescript
jwt: {
  payload: (user, type) => {
    return type === "access" ? { role: user.role } : {};
  }
}
```

### Password Peppering
Kroxt supports server-side peppering to protect against rainbow table attacks even if your database is leaked.
1. Set `usePepper: true` in config.
2. Add `JWT_PEPPER` to your `.env`.

---

## 🧠 API Reference (Exhaustive)

### `auth.signup()`
| Argument | Type | Description |
| --- | --- | --- |
| `userData` | `Omit<User, "id">` | Your user object without the ID (ID is auto-generated) |
| `password` | `string` (Optional) | Plain text password. Will be hashed using Argon2 |

### `auth.loginWithPassword()`
| Argument | Type | Description |
| --- | --- | --- |
| `email` | `string` | User email |
| `password` | `string` | User password |
| `clientIp` | `string` (Optional) | Required for IP-Blocking defense |

### `auth.changePassword()`
| Argument | Type | Description |
| --- | --- | --- |
| `userId` | `string` | The ID of the user to update |
| `newPassword` | `string` | The new plain text password |

> [!TIP]
> **Hash-Linked Revocation**: When you call `changePassword`, all existing refresh tokens for that user are immediately invalidated because they contain a fragment of the old password hash.

---

## 🚦 Error Handling

Kroxt throws descriptive errors that you can catch in your controller.

```typescript
try {
  await auth.loginWithPassword(email, password, req.ip);
} catch (err) {
  if (err.message === "IP is temporarily blocked.") {
    return res.status(403).send("Banned.");
  }
  if (err.message === "Too many requests, please try again later.") {
    return res.status(429).send("Slow down.");
  }
  return res.status(401).send("Invalid Credentials");
}
```

---

## 🔒 Security Best Practices

1. **Environmental Pepper**: Always use `JWT_PEPPER`. This adds a server-side secret to every password hash. If your database is stolen, your user passwords are still protected by this environment variable.
2. **Strict Revocation**: Set `enforceStrictRevocation: true` for high-security areas (like admin panels). This forces a database lookup on every single request to ensure the user hasn't been banned or changed their password in the last few seconds.
3. **Dual Tokens**: Always use the provided `accessToken` for short-term API access and the `refreshToken` (stored in an `HttpOnly` cookie) for session persistence.

---

## 🔗 Ecosystem
- [Kroxt Examples Repository](https://github.com/adepoju-oluwatobi/kroxt-examples)

## 📄 License
MIT © [Adepoju Oluwatobi](https://github.com/adepoju-oluwatobi)
