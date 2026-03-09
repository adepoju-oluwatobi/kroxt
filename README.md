# kroxt

A framework-agnostic, modular authentication engine for modern TypeScript applications. Built for security, extensibility, and ease of use.

## Features

- 🔐 **Secure Hashing**: Powered by `argon2` for industry-standard password security.
- 🎟️ **Stateless Sessions**: Managed via `jose` with high-performance JWT signing and verification.
- 🌍 **OAuth Ready**: Built-in support for GitHub and Google OAuth via `arctic`.
- 🧩 **Database Agnostic**: Use Mongoose, Prisma, Drizzle, or even in-memory stores via the `AuthAdapter` pattern.
- ✅ **Zod Schema Support**: Perfectly preserves and types your extended user metadata.
- 🚀 **ESM First**: Native support for NodeNext module resolution.

## Installation

```bash
npm install kroxt
```

## Quick Start

### 1. Initialize the Auth Engine

```typescript
import { createAuth } from "kroxt";
import { myDatabaseAdapter } from "./myAdapter.js";

const auth = createAuth({
  adapter: myDatabaseAdapter,
  secret: process.env.AUTH_SECRET,
  session: {
    expires: "7d" // jose compatible duration
  }
});
```

### 2. Sign Up a User

```typescript
const { user, token } = await auth.signup({
  email: "user@example.com",
  firstName: "Tobi",
  role: "tenant",
  // ...any other extended fields supported by your adapter
}, "strong-password-123");
```

### 3. Log In

```typescript
const { user, token } = await auth.loginWithPassword("user@example.com", "password");
```

### 4. Verify a Session

```typescript
const payload = await auth.verifyToken(token);
// auth.verifyToken returns the signed payload { sub: string, role: string, ... }
```

## The Adapter Pattern

Gatekeeper doesn't care which DB you use. You just need to implement the `AuthAdapter` interface:

```typescript
import type { AuthAdapter, User } from "kroxt/adapter";

export const myAdapter: AuthAdapter = {
  createUser: async (data) => { /* logic */ },
  findUserByEmail: async (email) => { /* logic */ },
  findUserById: async (id) => { /* logic */ },
  linkOAuthAccount: async (user, provider, provId) => { /* logic */ }
};
```

## Reference Project

Check out the `test-project` folder for a complete **Express + MongoDB** implementation using this library.

## License

ISC
