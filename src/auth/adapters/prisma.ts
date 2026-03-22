import type { AuthAdapter, User } from "./index.js";

/**
 * Creates a Prisma adapter using a Prisma delegate (e.g., prisma.user).
 * 
 * Works with any Prisma-supported database by using the standard
 * Prisma delegate operations (findUnique, create, update).
 * 
 * @param model - A Prisma delegate instance (e.g., prisma.user).
 * @returns An AuthAdapter compliant object.
 */
export function createPrismaAdapter<TUser extends User = User>(model: any): AuthAdapter<TUser> {
  return {
    async createUser(data: any) {
      const dataToSave = { id: data.id || globalThis.crypto.randomUUID(), ...data };
      const user = await model.create({ data: dataToSave });
      return user as TUser;
    },

    async findUserByEmail(email: string) {
      const user = await model.findUnique({
        where: { email },
      });
      return user as TUser | null;
    },

    async findUserById(id: string) {
      const user = await model.findUnique({
        where: { id },
      });
      return user as TUser | null;
    },

    async linkOAuthAccount(userId: string, provider: string, providerId: string) {
      await model.update({
        where: { id: userId },
        data: {
          oauthProvider: provider,
          oauthId: providerId,
        },
      });
    },
  };
}
