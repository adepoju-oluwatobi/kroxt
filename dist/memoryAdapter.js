function createMemoryAdapter() {
  const users = /* @__PURE__ */ new Map();
  const accounts = /* @__PURE__ */ new Map();
  return {
    createUser: async (data) => {
      const id = data.id || Date.now().toString();
      const newUser = { ...data, id };
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
export {
  createMemoryAdapter
};
//# sourceMappingURL=memoryAdapter.js.map
