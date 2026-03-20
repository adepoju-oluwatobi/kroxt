"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var memoryAdapter_exports = {};
__export(memoryAdapter_exports, {
  createMemoryAdapter: () => createMemoryAdapter
});
module.exports = __toCommonJS(memoryAdapter_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createMemoryAdapter
});
//# sourceMappingURL=memoryAdapter.cjs.map
