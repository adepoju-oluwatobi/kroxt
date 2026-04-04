import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import type { AuthAdapter, User } from "../adapters/index.js";
import type { Provider } from "../providers/index.js";
import { createRateLimiter, type RateLimitOptions } from "../security/rate-limit.js";

export interface CreateAuthOptions {
    adapter: AuthAdapter<any>;
    secret: string | Uint8Array;
    pepper?: string;
    session?: {
        expires?: string | number; // For access tokens
        refreshExpires?: string | number; // For refresh tokens
        enforceStrictRevocation?: boolean; // If true, DB check on access tokens
    };
    providers?: Provider[];
    jwt?: {
        /**
         * A callback to add custom fields to the JWT payload.
         * It receives the user object and the token type ('access' or 'refresh').
         * Return an object containing the fields to be merged into the payload.
         * You can also override default fields like 'sub'.
         */
        payload?: (user: User<any>, type: "access" | "refresh") => Record<string, any>;
    };
    rateLimit?: RateLimitOptions;
    ipBlocking?: { maxStrikes: number; blockDurationMs: number };
    passwordPolicy?: {
        minLength?: number;
        requireUppercase?: boolean;
        requireLowercase?: boolean;
        requireNumber?: boolean;
        requireSpecialCharacter?: boolean;
    };
}

export function createAuth(options: CreateAuthOptions) {
    const { adapter, secret, pepper, session, providers, rateLimit, ipBlocking } = options;
    const encodedSecret = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
    const expiration = session?.expires || "1h"; // Default access token to 1h
    const refreshExpiration = session?.refreshExpires || "7d";

    const configuredRateLimiter = createRateLimiter(adapter, rateLimit);

    /**
     * Generates a stateless JWT for a user session
     */
    async function generateToken(user: User<any>, type: "access" | "refresh" = "access") {
        let payload: Record<string, any> = { 
            sub: user.id, 
            role: user.role, 
            sv: user.sessionVersion || 0, // Include Session Version
            type 
        };

        // Lightweight Session Revocation: Link token to current password hash state
        if (user.passwordHash && (type === "refresh" || session?.enforceStrictRevocation)) {
            payload.pw_frag = user.passwordHash.slice(-10);
        }

        if (options.jwt?.payload) {
            const customPayload = options.jwt.payload(user, type);
            payload = { ...payload, ...customPayload };
        }

        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(type === "access" ? expiration : refreshExpiration)
            .sign(encodedSecret);
    }

    /**
     * Verifies a JWT and returns the payload.
     * Optionally checks for a specific token type (access/refresh).
     */
    async function verifyToken(token: string, expectedType: "access" | "refresh" = "access") {
        try {
            const { payload } = await jwtVerify(token, encodedSecret);
            if (payload.type !== expectedType) return null;

            if (expectedType === "access" && session?.enforceStrictRevocation) {
                const user = await adapter.findUserById(payload.sub as string);
                if (!user) return null;

                // Password change check
                if (payload.pw_frag && payload.pw_frag !== user.passwordHash?.slice(-10)) {
                    throw new Error("Strict Revocation: Access Token revoked due to password change");
                }

                // Global Logout (Session Version) check
                if (payload.sv !== (user.sessionVersion || 0)) {
                    throw new Error("Strict Revocation: Session revoked (Logged out)");
                }
            }

            return payload;
        } catch (e) {
            return null;
        }
    }

    /**
     * Refreshes an access token using a valid refresh token.
     */
    async function refresh(refreshToken: string) {
        const payload = await verifyToken(refreshToken, "refresh");
        if (!payload || !payload.sub) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await adapter.findUserById(payload.sub as string);
        if (!user) {
            throw new Error("User not found");
        }

        // Lightweight Session Revocation (Password change & Session Version)
        if (user.passwordHash) {
            if (payload.pw_frag && payload.pw_frag !== user.passwordHash.slice(-10)) {
                throw new Error("Session revoked (Password changed)");
            }
            if (payload.sv !== (user.sessionVersion || 0)) {
                throw new Error("Session revoked (Logged out)");
            }
        }

        const accessToken = await generateToken(user, "access");
        return { accessToken };
    }

    function validatePassword(password?: string) {
        if (!password || !options.passwordPolicy) return;
        
        const p = options.passwordPolicy;
        if (p.minLength && password.length < p.minLength) {
            throw new Error(`Password must be at least ${p.minLength} characters`);
        }
        if (p.requireUppercase && !/[A-Z]/.test(password)) {
            throw new Error("Password must contain at least one uppercase letter");
        }
        if (p.requireLowercase && !/[a-z]/.test(password)) {
            throw new Error("Password must contain at least one lowercase letter");
        }
        if (p.requireNumber && !/[0-9]/.test(password)) {
            throw new Error("Password must contain at least one number");
        }
        if (p.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) {
            throw new Error("Password must contain at least one special character");
        }
    }

    /**
     * Signup with a new user payload.
     * Incorporates server-side pepper for password hashing if provided.
     */
    async function signup(userData: Omit<User<any>, "id">, password?: string) {
        let dataToSave = { ...userData };

        if (password) {
            validatePassword(password);
            const passwordWithPepper = pepper ? `${password}${pepper}` : password;
            dataToSave.passwordHash = await argon2.hash(passwordWithPepper);
        }

        const newUser = await adapter.createUser(dataToSave);
        const accessToken = await generateToken(newUser, "access");
        const refreshToken = await generateToken(newUser, "refresh");

        return { user: newUser, accessToken, refreshToken };
    }

    /**
     * Standard Email/Password Login.
     * Includes timing attack protection and password peppering.
     */
    async function loginWithPassword(email: string, password: string, clientIp?: string) {
        if (ipBlocking && clientIp && configuredRateLimiter) {
            const strikeCheck = await configuredRateLimiter.check(`strike_${clientIp}`);
            if (strikeCheck && strikeCheck.count >= ipBlocking.maxStrikes) {
                throw new Error("IP is temporarily blocked.");
            }
        }

        if (configuredRateLimiter) {
            const limitStatus = await configuredRateLimiter.increment(`login_${email}`);
            if (!limitStatus.success) {
                if (ipBlocking && clientIp) {
                    await configuredRateLimiter.increment(`strike_${clientIp}`, ipBlocking.blockDurationMs);
                }
                throw new Error("Too many requests, please try again later.");
            }
        }

        const user = await adapter.findUserByEmail(email);

        // Timing attack protection: Always verify a hash, even if user doesn't exist.
        // We use a dummy hash to keep execution time consistent.
        const dummyHash = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RytpInY7i6C9M5l0D4n8Q+7j/J+i";
        const targetHash = user?.passwordHash || dummyHash;
        const passwordWithPepper = pepper ? `${password}${pepper}` : password;

        const isValid = await argon2.verify(targetHash, passwordWithPepper);

        if (!user || !user.passwordHash || !isValid) {
            throw new Error("Invalid credentials");
        }

        const accessToken = await generateToken(user, "access");
        const refreshToken = await generateToken(user, "refresh");

        return { user, accessToken, refreshToken };
    }

    /**
     * Changes a user's password securely using the configured pepper and hashing algorithm.
     * Instantly revokes all active refresh tokens for the user globally.
     */
    async function changePassword(userId: string, newPassword: string) {
        if (!adapter.updateUser) {
            throw new Error("The AuthAdapter does not support updating user records natively.");
        }

        validatePassword(newPassword);
        const passwordWithPepper = pepper ? `${newPassword}${pepper}` : newPassword;
        const newHash = await argon2.hash(passwordWithPepper);

        const updatedUser = await adapter.updateUser(userId, { passwordHash: newHash } as any);
        if (!updatedUser) {
            throw new Error("User not found");
        }
        
        return updatedUser;
    }

    /**
     * Terminate all active sessions for a user globally.
     * This increments the session version in the database, invalidating all current tokens.
     */
    async function logout(userId: string) {
        if (!adapter.invalidateSession) {
            // If the adapter doesn't natively support it, we fall back to manual updateUser
            if (adapter.updateUser) {
                const user = await adapter.findUserById(userId);
                const currentVersion = user?.sessionVersion || 0;
                await adapter.updateUser(userId, { sessionVersion: currentVersion + 1 } as any);
                return { success: true };
            }
            throw new Error("Logout failed: The AuthAdapter does not support session invalidation.");
        }
        await adapter.invalidateSession(userId);
        return { success: true };
    }

    return {
        signup,
        loginWithPassword,
        changePassword,
        logout,
        refresh,
        verifyToken,
        generateToken,
        _providers: providers
    };
}

/**
 * Utility to generate a high-entropy cryptographically secure secret.
 * Useful for initializing the 'secret' option in createAuth.
 */
export function generateSecret(length: number = 32): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}
