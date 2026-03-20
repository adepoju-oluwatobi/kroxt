export interface BaseUser {
    id: string;
    email: string;
    passwordHash?: string;
    role?: string;
}
export type User<TExtended = Record<string, any>> = BaseUser & TExtended;
export interface AuthAdapter<TUser = User> {
    createUser: (data: any) => Promise<TUser>;
    findUserByEmail: (email: string) => Promise<TUser | null>;
    findUserById: (id: string) => Promise<TUser | null>;
    linkOAuthAccount: (userId: string, provider: string, providerId: string) => Promise<void>;
}
//# sourceMappingURL=adapter.d.ts.map