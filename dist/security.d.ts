/**
 * Generates a stateless CSRF token using the double-submit cookie pattern.
 * This is recommended for Express/Kroxt setups using cookies for sessions.
 */
export declare function generateCsrfToken(): string;
/**
 * Simple middleware-ready check for CSRF tokens.
 * Matches a token from the request body/headers against a cookie.
 */
export declare function verifyCsrf(tokenInRequest: string, tokenInCookie: string): boolean;
/**
 * Security Recommendations for Kroxt:
 * 1. Always set cookies with: httpOnly: true, secure: true, sameSite: 'strict'
 * 2. Use a 'pepper' in createAuth to protect hashes.
 * 3. Implement rate limiting on /login and /register endpoints.
 */
//# sourceMappingURL=security.d.ts.map