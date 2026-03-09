/**
 * Creates an in-memory database adapter for the auth engine.
 * This is useful for testing, prototyping, or when you don't need persistent storage.
 * All data is kept in memory and is lost when the server restarts.
 */
export function createMemoryAdapter() {
    const users = new Map();
    const accounts = new Map();
    return {
        createUser: async (data) => {
            // Auto-generate ID if not provided
            const id = data.id || Date.now().toString();
            const newUser = { ...data, id };
            // Store using email as the primary lookup key
            users.set(newUser.email, newUser);
            return newUser;
        },
        findUserByEmail: async (email) => {
            return users.get(email) || null;
        },
        findUserById: async (id) => {
            for (const user of users.values()) {
                if (user.id === id) {
                    return user;
                }
            }
            return null;
        },
        linkOAuthAccount: async (userId, provider, providerId) => {
            const accountId = `${provider}_${providerId}`;
            accounts.set(accountId, { userId, provider, providerId });
        }
    };
}
//# sourceMappingURL=memoryAdapter.js.map