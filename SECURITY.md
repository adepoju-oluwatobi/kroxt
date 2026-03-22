# Security Policy

## Supported Versions

We currently provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2.0 | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability in Kroxt, please report it via one of the following methods:

1.  **GitHub Security Advisory**: Open a draft advisory in the [Kroxt repository](https://github.com/adepoju-oluwatobi/kroxt/security/advisories/new).
2.  **Email**: Send a detailed report to **security@kroxt.dev** (or the project maintainer directly).

### What to include in your report:

-   A detailed description of the vulnerability.
-   Steps to reproduce the issue (PoC scripts are highly appreciated).
-   Potential impact (e.g., account takeover, data leak).

### Our Commitment

-   **Acknowledgment**: We will acknowledge receipt of your report within 24–48 hours.
-   **Resolution**: We aim to provide a fix or mitigation plan within 7 business days for critical issues.
-   **Disclosure**: We will coordinate the disclosure date with you to ensure a fix is available before the vulnerability is made public.

## Security Best Practices for Users

-   Always use a server-side **Pepper** (`JWT_PEPPER`) in addition to your secret.
-   Keep your `argon2` parameters at recommended production levels.
-   Regularly rotate your `JWT_SECRET` if you suspect any compromise.

Thank you for helping keep Kroxt secure!
