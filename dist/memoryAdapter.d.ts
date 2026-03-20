import type { AuthAdapter, User } from "./adapter.js";
/**
 * Creates an in-memory database adapter for the auth engine.
 * This is useful for testing, prototyping, or when you don't need persistent storage.
 * All data is kept in memory and is lost when the server restarts.
 */
export declare function createMemoryAdapter<TUser extends User = User>(): AuthAdapter<TUser>;
//# sourceMappingURL=memoryAdapter.d.ts.map