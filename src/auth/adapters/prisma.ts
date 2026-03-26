import type { AuthAdapter, User } from "./index.js";

/**
 * Creates a Prisma adapter using a Prisma delegate (e.g., prisma.user).
 * 
 * Works with any Prisma-supported database by using the standard
 * Prisma delegate operations (findUnique, create, update).
 * 
 * @param model - A Prisma delegate instance (e.g., prisma.user).
 * @param rateLimitModel - An optional Prisma delegate for rate limit tracking.
 * @returns An AuthAdapter compliant object.
 */
export function createPrismaAdapter<TUser extends User = User>(model: any, rateLimitModel?: any): AuthAdapter<TUser> {
  const adapter: AuthAdapter<TUser> = {
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

    async updateUser(id: string, data: Partial<TUser>) {
      const user = await model.update({
        where: { id },
        data,
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

  if (rateLimitModel) {
    adapter.incrementRateLimit = async (key: string, windowMs: number) => {
      const now = Date.now();
      const record = await rateLimitModel.findUnique({ where: { key } });
      
      if (!record || now > record.resetTime) {
          const newRecord = await rateLimitModel.upsert({
              where: { key },
              update: { count: 1, resetTime: now + windowMs },
              create: { key, count: 1, resetTime: now + windowMs }
          });
          return { count: newRecord.count, resetTime: newRecord.resetTime };
      } else {
          const updated = await rateLimitModel.update({
              where: { key },
              data: { count: { increment: 1 } }
          });
          return { count: updated.count, resetTime: updated.resetTime };
      }
    };

    adapter.getRateLimit = async (key: string) => {
      const now = Date.now();
      const record = await rateLimitModel.findUnique({ where: { key } });
      if (!record || now > record.resetTime) return null;
      return { count: record.count, resetTime: record.resetTime };
    };
  }

  return adapter;
}
