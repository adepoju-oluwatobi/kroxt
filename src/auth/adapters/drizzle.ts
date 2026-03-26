import type { AuthAdapter, User } from "./index.js";

/**
 * Creates a Drizzle ORM adapter.
 * 
 * Works with any Drizzle-supported database (PostgreSQL, MySQL, SQLite)
 * by using the standard drizzle-orm `db` instance and table definition.
 * 
 * @param db - The Drizzle database instance.
 * @param table - The Drizzle table representing users.
 * @param eq - The Drizzle `eq` operator (imported from `drizzle-orm`).
 * @param rateLimitTable - Optional Drizzle table for rate limiting tracking.
 * @returns An AuthAdapter compliant object.
 */
export function createDrizzleAdapter<TUser extends User = User>(
  db: any,
  table: any,
  eq: any,
  rateLimitTable?: any
): AuthAdapter<TUser> {
  const adapter: AuthAdapter<TUser> = {
    async createUser(data: any) {
      const dataToSave = { id: data.id || globalThis.crypto.randomUUID(), ...data };
      const results = await db.insert(table).values(dataToSave).returning();
      return results[0] as TUser;
    },

    async findUserByEmail(email: string) {
      const results = await db.select().from(table).where(eq(table.email, email)).limit(1);
      return (results[0] || null) as TUser | null;
    },

    async findUserById(id: string) {
      const results = await db.select().from(table).where(eq(table.id, id)).limit(1);
      return (results[0] || null) as TUser | null;
    },

    async updateUser(id: string, data: Partial<TUser>) {
      const results = await db.update(table).set(data).where(eq(table.id, id)).returning();
      return (results[0] || null) as TUser | null;
    },

    async linkOAuthAccount(userId: string, provider: string, providerId: string) {
      await db.update(table)
        .set({
          oauthProvider: provider,
          oauthId: providerId,
        })
        .where(eq(table.id, userId));
    },
  };

  if (rateLimitTable) {
    adapter.incrementRateLimit = async (key: string, windowMs: number) => {
      const now = Date.now();
      const resetTime = now + windowMs;
      
      let records = await db.select().from(rateLimitTable).where(eq(rateLimitTable.key, key)).limit(1);
      let record = records[0];
      
      if (!record || now > record.resetTime) {
          if (record) {
              await db.update(rateLimitTable).set({ count: 1, resetTime }).where(eq(rateLimitTable.key, key));
          } else {
              await db.insert(rateLimitTable).values({ key, count: 1, resetTime });
          }
          return { count: 1, resetTime };
      } else {
          await db.update(rateLimitTable).set({ count: record.count + 1 }).where(eq(rateLimitTable.key, key));
          return { count: record.count + 1, resetTime: record.resetTime };
      }
    };

    adapter.getRateLimit = async (key: string) => {
      const now = Date.now();
      let records = await db.select().from(rateLimitTable).where(eq(rateLimitTable.key, key)).limit(1);
      let record = records[0];
      if (!record || now > record.resetTime) return null;
      return { count: record.count, resetTime: record.resetTime };
    };
  }

  return adapter;
}
