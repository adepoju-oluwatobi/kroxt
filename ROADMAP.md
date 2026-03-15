# Kroxt 2026 Roadmap: The Path to v2.0

While Kroxt is already secure and modular, the following roadmap focuses on becoming a industry-leader in **Developer Experience (DX)** and **Modern Standards**.

## 1. Passwordless & Modern Auth
Passkeys are the future of the web. Making them "plug-and-play" will be Kroxt's biggest differentiator.

- [ ] **Passkey Support (WebAuthn)**: Add native support for Passkeys to eliminate password reliance.
- [ ] **Native MFA**: Add a built-in engine for TOTP (Google Authenticator) and backup codes.
- [ ] **Magic Links**: Implement secure, one-time token flows for passwordless email login.

## 2. Official Adapter Ecosystem
Currently, users implement their own adapters. We should provide pre-built, optimized packages.

- [ ] **@kroxt/adapter-prisma**: Direct integration with Prisma schemas.
- [ ] **@kroxt/adapter-drizzle**: Support for the fastest-growing TS ORM.
- [ ] **@kroxt/adapter-pg**: Low-level Postgres support for maximum performance.

## 3. Framework First-Class Citizens
Kroxt is framework-agnostic, but we can make it feel native everywhere.

- [ ] **@kroxt/express**: Official middleware with better error handling.
- [ ] **@kroxt/hono**: Optimized for Edge/Cloudflare Workers.
- [ ] **@kroxt/react / @kroxt/nextjs**: Frontend hooks (`useAuth`, `AuthContext`) for seamless token management.

## 4. Developer Tools (DX)
- [ ] **Kroxt CLI**: A `npx kroxt init` command to scaffold your `auth.ts` and adapters.
- [ ] **Admin Dashboard (Optional add-on)**: A local-first UI to manage users, sessions, and roles during development.
- [ ] **OpenAPI / Swagger Integration**: Automatically document your auth routes.

## 5. Security & Reliability
- [ ] **Session Revocation**: Add logic to invalidate all sessions for a specific user.
- [ ] **Rate Limiting Engine**: Built-in helpers to prevent brute-force attacks on login/signup.
- [ ] **100% Test Coverage**: Harden the core hashing and token verification logic.

---

### Phase 1 Recommendation (Quickest Value)
Starting with **Official Adapters** and a **CLI tool** will significantly reduce the "time-to-first-login" for new developers.
