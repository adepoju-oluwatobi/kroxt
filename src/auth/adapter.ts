export interface BaseUser {
  id: string;
  email: string;
  passwordHash?: string;
  role?: string;
}

// Allows any extended fields natively (like nin, bvn, maritalStatus, etc.)
export type User<TExtended = Record<string, any>> = BaseUser & TExtended;

export interface AuthAdapter<TUser = User> {
  createUser: (data: any) => Promise<TUser>;
  findUserByEmail: (email: string) => Promise<TUser | null>;
  findUserById: (id: string) => Promise<TUser | null>;
  linkOAuthAccount: (userId: string, provider: string, providerId: string) => Promise<void>;
}
