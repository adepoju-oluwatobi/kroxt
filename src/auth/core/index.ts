import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import type { AuthAdapter, User } from "../adapters/index.js";
import type { Provider } from "../providers/index.js";

export interface CreateAuthOptions {
    adapter: AuthAdapter<any>;
    secret: string | Uint8Array;
    pepper?: string;
    session?: {
        expires?: string | number; // For access tokens
        refreshExpires?: string | number; // For refresh tokens
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
}

export function createAuth(options: CreateAuthOptions) {
    const { adapter, secret, pepper, session, providers } = options;
    const encodedSecret = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
    const expiration = session?.expires || "1h"; // Default access token to 1h
    const refreshExpiration = session?.refreshExpires || "7d";

    /**
     * Generates a stateless JWT for a user session
     */
    async function generateToken(user: User<any>, type: "access" | "refresh" = "access") {
        let payload: Record<string, any> = { sub: user.id, role: user.role, type };

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

        const accessToken = await generateToken(user, "access");
        return { accessToken };
    }

    /**
     * Signup with a new user payload.
     * Incorporates server-side pepper for password hashing if provided.
     */
    async function signup(userData: Omit<User<any>, "id">, password?: string) {
        let dataToSave = { ...userData };

        if (password) {
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
    async function loginWithPassword(email: string, password: string) {
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

    return {
        signup,
        loginWithPassword,
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
