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

    const isValid =
        /^[a-f0-9]{64}$/i.test(tokenInRequest) &&
        /^[a-f0-9]{64}$/i.test(tokenInCookie);

    if (!isValid) return false;

    const bufA = Buffer.from(tokenInRequest, "hex");
    const bufB = Buffer.from(tokenInCookie, "hex");

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Security Recommendations for Kroxt:
 * 1. Always set cookies with: httpOnly: true, secure: true, sameSite: 'strict'
 * 2. Use a 'pepper' in createAuth to protect hashes.
 * 3. Implement rate limiting on /login and /register endpoints.
 */
