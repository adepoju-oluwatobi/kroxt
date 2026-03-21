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
 * @returns An AuthAdapter compliant object.
 */
export function createDrizzleAdapter<TUser extends User = User>(
  db: any,
  table: any,
  eq: any
): AuthAdapter<TUser> {
  return {
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

    async linkOAuthAccount(userId: string, provider: string, providerId: string) {
      await db.update(table)
        .set({
          oauthProvider: provider,
          oauthId: providerId,
        })
        .where(eq(table.id, userId));
    },
  };
}
