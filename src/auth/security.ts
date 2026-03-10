import crypto from "crypto";

/**
 * Generates a stateless CSRF token using the double-submit cookie pattern.
 * This is recommended for Express/Kroxt setups using cookies for sessions.
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Simple middleware-ready check for CSRF tokens.
 * Matches a token from the request body/headers against a cookie.
 */
export function verifyCsrf(tokenInRequest: string, tokenInCookie: string): boolean {
    if (!tokenInRequest || !tokenInCookie) return false;

    // Constant time comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(tokenInRequest),
            Buffer.from(tokenInCookie)
        );
    } catch {
        return false;
    }
}

/**
 * Security Recommendations for Kroxt:
 * 1. Always set cookies with: httpOnly: true, secure: true, sameSite: 'strict'
 * 2. Use a 'pepper' in createAuth to protect hashes.
 * 3. Implement rate limiting on /login and /register endpoints.
 */
