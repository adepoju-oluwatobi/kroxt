import type { AuthAdapter, User } from "./index.js";

/**
 * Creates an in-memory database adapter for the auth engine.
 * This is useful for testing, prototyping, or when you don't need persistent storage.
 * All data is kept in memory and is lost when the server restarts.
 */
export function createMemoryAdapter<TUser extends User = User>(): AuthAdapter<TUser> {
    const users = new Map<string, TUser>();
    const accounts = new Map<string, { userId: string; provider: string; providerId: string }>();

    return {
        createUser: async (data: any) => {
            // Auto-generate ID if not provided
            const id = data.id || Date.now().toString();
            const newUser = { ...data, id } as TUser;

            // Store using email as the primary lookup key
            users.set(newUser.email, newUser);
            return newUser;
        },

        findUserByEmail: async (email: string) => {
            return users.get(email) || null;
        },

        findUserById: async (id: string) => {
            for (const user of users.values()) {
                if (user.id === id) {
                    return user;
                }
            }
            return null;
        },

        linkOAuthAccount: async (userId: string, provider: string, providerId: string) => {
            const accountId = `${provider}_${providerId}`;
            accounts.set(accountId, { userId, provider, providerId });
        }
    };
}
