import type { AuthAdapter, User } from "./index.js";

/**
 * Creates a MongoDB adapter using a Mongoose model.
 * 
 * @param model - A Mongoose model instance (e.g., User model).
 * @returns An AuthAdapter compliant object.
 */
export function createMongoAdapter<TUser extends User = User>(model: any): AuthAdapter<TUser> {
  return {
    async createUser(data: any) {
      const user = await model.create(data);
      const obj = user.toObject();
      return { ...obj, id: obj._id.toString() } as TUser;
    },

    async findUserByEmail(email: string) {
      const user = await model.findOne({ email });
      if (!user) return null;
      const obj = user.toObject();
      return { ...obj, id: obj._id.toString() } as TUser;
    },

    async findUserById(id: string) {
      const user = await model.findById(id);
      if (!user) return null;
      const obj = user.toObject();
      return { ...obj, id: obj._id.toString() } as TUser;
    },

    async linkOAuthAccount(userId: string, provider: string, providerId: string) {
      await model.findByIdAndUpdate(userId, {
        oauthProvider: provider,
        oauthId: providerId,
      });
    },
  };
}
