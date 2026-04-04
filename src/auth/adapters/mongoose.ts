import type { AuthAdapter, User } from "./index.js";

/**
 * Creates a pre-configured Mongoose model for rate limiting.
 * @param mongoose The mongoose instance to use for schema creation.
 */
export function createRateLimitModel(mongoose: any) {
  const schema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 1 },
    resetTime: { type: Number, required: true },
    expiresAt: { type: Date, required: true, expires: 0 }
  });
  return mongoose.models.KroxtRateLimit || mongoose.model('KroxtRateLimit', schema);
}

/**
 * Creates a MongoDB adapter using a Mongoose model.
 * 
 * @param model - A Mongoose model instance (e.g., User model).
 * @param rateLimitModel - An optional Mongoose model for rate limiting tracking.
 * @returns An AuthAdapter compliant object.
 */
export function createMongoAdapter<TUser extends User = User>(model: any, rateLimitModel?: any): AuthAdapter<TUser> {
  const adapter: AuthAdapter<TUser> = {
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

    async updateUser(id: string, data: Partial<TUser>) {
      const user = await model.findByIdAndUpdate(id, data, { new: true });
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

    async invalidateSession(userId: string) {
      await model.findByIdAndUpdate(userId, { 
        $inc: { sessionVersion: 1 } 
      });
    },
  };

  if (rateLimitModel) {
    adapter.incrementRateLimit = async (key: string, windowMs: number) => {
      const now = Date.now();
      let record = await rateLimitModel.findOne({ key });
      
      if (!record || now > record.resetTime) {
        record = await rateLimitModel.findOneAndUpdate(
          { key },
          { count: 1, resetTime: now + windowMs, expiresAt: new Date(now + windowMs) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        record = await rateLimitModel.findOneAndUpdate(
          { key },
          { $inc: { count: 1 } },
          { new: true }
        );
      }

      return { count: record.count, resetTime: record.resetTime };
    };

    adapter.getRateLimit = async (key: string) => {
      const now = Date.now();
      const record = await rateLimitModel.findOne({ key });
      if (!record || now > record.resetTime) return null;
      return { count: record.count, resetTime: record.resetTime };
    };
  }

  return adapter;
}
