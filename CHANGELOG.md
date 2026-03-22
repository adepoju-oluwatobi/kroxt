# Changelog

All notable changes to the Kroxt project will be documented in this file.

## [1.2.2] - 2026-03-22

### Added
- **Security Policy**: Added `SECURITY.md` and official vulnerability reporting guidelines.
- **CSRF Example**: New standalone security example demonstrating Double-Submit Cookie protection.

### Fixed
- **Security (Critical)**: Hardened `verifyCsrf` with strict regex validation (`/^[a-f0-9]{64}$/i`) and hex-aware buffer comparisons to eliminate timing attacks and length-guessing vulnerabilities.
- **TypeScript (Examples)**: Resolved "Cannot find module 'kroxt'" and "implicit any" errors across all Express examples.

## [1.2.0] - 2026-03-22

### Added
- **Universal SQL Support**: Official adapters for **Drizzle** and **Prisma**.
- **Multi-Framework Ecosystem**: Standardized implementation patterns for **Express**, **Fastify**, and **Hono**.
- **Documentation Overhaul**: Modernized the technical documentation with framework-agnostic guides.
- **Mobile Navigation**: Added sidebar overlays and backdrop blur effects for a premium mobile experience.
- **Unified Examples**: Created a centralized repository (`kroxt-examples`) for all framework-adapter combinations.

### Fixed
- **TypeScript Resolution**: Corrected `kroxt` module resolution issues in local development environments.
- **Mobile Layout**: Fixed sidebar stacking order (`z-index`) and horizontal page overflow on small screens.
- **Prisma ESM Support**: Added workaround instructions for Prisma client imports in ESM-based Windows environments.

## [1.1.5] - 2026-03-10
### Added
- Initial support for Mongoose adapter.
- JWT token rotation logic.
- Basic documentation site.

## [1.0.0] - 2026-03-05
### Added
- Core authentication engine.
- Argon2 password hashing.
- Token rotation security.
