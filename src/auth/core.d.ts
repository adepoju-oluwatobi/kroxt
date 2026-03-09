import type { AuthAdapter, User } from "./adapter.js";
import type { Provider } from "./providers.js";
export interface CreateAuthOptions {
    adapter: AuthAdapter<any>;
    secret: string;
    session?: {
        expires?: string | number;
    };
    providers?: Provider[];
}
export declare function createAuth(options: CreateAuthOptions): {
    signup: (userData: Omit<User<any>, "id">, password?: string) => Promise<{
        user: any;
        token: string;
    }>;
    loginWithPassword: (email: string, password: string) => Promise<{
        user: any;
        token: string;
    }>;
    verifyToken: (token: string) => Promise<import("jose").JWTPayload | null>;
    generateToken: (user: User<any>) => Promise<string>;
    _providers: Provider[] | undefined;
};
//# sourceMappingURL=core.d.ts.map