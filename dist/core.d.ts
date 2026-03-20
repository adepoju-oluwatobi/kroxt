import type { AuthAdapter, User } from "./adapter.js";
import type { Provider } from "./providers.js";
export interface CreateAuthOptions {
    adapter: AuthAdapter<any>;
    secret: string | Uint8Array;
    pepper?: string;
    session?: {
        expires?: string | number;
        refreshExpires?: string | number;
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
export declare function createAuth(options: CreateAuthOptions): {
    signup: (userData: Omit<User<any>, "id">, password?: string) => Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    loginWithPassword: (email: string, password: string) => Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    refresh: (refreshToken: string) => Promise<{
        accessToken: string;
    }>;
    verifyToken: (token: string, expectedType?: "access" | "refresh") => Promise<import("jose").JWTPayload | null>;
    generateToken: (user: User<any>, type?: "access" | "refresh") => Promise<string>;
    _providers: Provider[] | undefined;
};
/**
 * Utility to generate a high-entropy cryptographically secure secret.
 * Useful for initializing the 'secret' option in createAuth.
 */
export declare function generateSecret(length?: number): Uint8Array;
//# sourceMappingURL=core.d.ts.map