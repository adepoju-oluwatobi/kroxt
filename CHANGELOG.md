# Changelog

All notable changes to the **Kroxt** authentication engine will be documented in this file.

## [1.3.4] - 2026-03-29

### ✨ Added
- **Kroxt CLI (`npx kroxt init`)**: A powerful, interactive command-line tool to bootstrap your `auth.ts` configuration, set up `.env` secrets, and generate `tsconfig.json` automatically.
- **Granular Security Toggles**: CLI now prompts for Rate Limiting, IP Blocking, Strict Session Revocation, and Password Peppering.
- **Password Peppering**: Added support for server-side peppering to further harden password hashes.
- **Integrated Rate Limiting**: New models and logic for brute-force defense and IP-based blocking.
- **Monochrome Design System**: A complete visual overhaul of the landing page and documentation to a high-contrast, premium "Obsidian" aesthetic.

### ⚙️ Changed
- **Hybrid Import Style**: Optimized imports to use `kroxt` for core logic and `kroxt/adapters/*` for specific database adapters.
- **Root Exports**: Consolidated adapter factory functions into the root package for easier discovery.
- **Module Resolution**: Updated CLI-generated `tsconfig.json` to use `moduleResolution: "bundler"` for better compatibility with modern ESM projects.

### 🛡️ Security
- **IP Blocking Layer**: Automatically Ban IPs after a configurable number of failed attempts.
- **Real-time Revocation**: Enhanced token validation fragmenting for instant session killing upon password change.

---

## [1.2.2] - 2026-03-22
### ✨ Added
- Hardened CSRF protection with Regex + Hex comparison.
- Official Security Policy (`SECURITY.md`).
- Multi-framework examples (Express, Fastify, Hono).

## [1.2.1] - 2026-03-15
### ✨ Added
- Initial support for Prisma and Drizzle adapters.
- Basic Argon2 implementation.
