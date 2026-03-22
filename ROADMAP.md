# Kroxt 2026 Roadmap: The Path to v2.0

While Kroxt is already secure and modular, the following roadmap focuses on becoming an industry-leader in **Security**, **Developer Experience**, and **Modern Standards**.

## 🛡️ Priority 1: Advanced Security & Hardening
Security is the heartbeat of Kroxt. We're doubling down on pro-active defense.
- [ ] **Automatic Rate Limiting**: Built-in, intelligent protection against brute-force and credential stuffing.
- [ ] **Automatic IP Blocking**: Proactive defense system to detect and throttle malicious patterns.
- [ ] **Session Revocation**: Real-time invalidation of all sessions for a specific user (critical for compromised accounts).
- [ ] **Passkeys (WebAuthn)**: Native support for biometric login (FaceID, TouchID, Yubikeys).
- [ ] **Social Auth (OAuth2 / OIDC)**: Official providers for GitHub, Google, and Apple.
- [ ] **Multi-Factor Auth (MFA)**: Built-in engine for TOTP and encrypted backup codes.
- [ ] **100% Core Coverage**: Reaching 100% unit test coverage for the core auth logic.

## 🚀 Priority 2: Developer Experience (Quick Onboarding)
Reducing the "time-to-first-login" while maintaining maximum security.

- [ ] **Kroxt CLI (`npx kroxt init`)**: A command-line tool to bootstrap your `auth.ts`, choose adapters, and generate secure environment variables.
- [ ] **Official Starter Templates**: Production-ready GitHub templates for `Next.js + Prisma`, `Express + Drizzle`, and `Fastify + Mongo`.
- [ ] **Interactive Documentation**: A "playground" to test different auth configurations in the browser.

## 📦 Priority 3: Official Package Ecosystem
Modularizing our adapters and plugins into scoped NPM packages.

- [ ] **@kroxt/adapter-drizzle**: Dedicated package for Drizzle (moved from example to core).
- [ ] **@kroxt/adapter-prisma**: Dedicated package for Prisma (moved from example to core).
- [ ] **@kroxt/adapter-mongoose**: Dedicated package for MongoDB (moved from example to core).
- [ ] **@kroxt/express / @kroxt/fastify / @kroxt/hono**: Official middleware packages with built-in error handling and type-safe contexts.

## 🖥️ Priority 4: Frontend Integration
Making Kroxt feel native in your UI.

- [ ] **@kroxt/react / @kroxt/nextjs**: Frontend hooks (`useAuth`, `AuthContext`) and server-side utilities for seamless session management.
- [ ] **@kroxt/vue / @kroxt/Svelte**: Similar integration for the wider frontend ecosystem.

## 📊 Priority 5: Admin & Observability
- [ ] **Audit Logs**: Built-in tracking for security events (logins, password changes, failed attempts).
- [ ] **Admin Dashboard (Optional add-on)**: A local-first UI to manage users, roles, and active sessions.
- [ ] **Analytics Engine**: Visualize user growth and session activity.

---

### Phase 1 Focus (Immediate)
Hardening the **Core Engine** security (specifically **Rate Limiting** and **Session Revocation**) while simplifying onboarding via the **Kroxt CLI**.
