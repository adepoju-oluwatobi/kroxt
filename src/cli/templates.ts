import crypto from 'crypto';

export const authTemplate = (adapter: string, secret: string, options: any) => `import { createAuth } from "kroxt";
${getAdapterImportBlock(adapter)}
import dotenv from "dotenv";

dotenv.config();

${getAdapterInitialization(adapter, options)}

export const auth = createAuth({
  adapter: authAdapter,
  secret: process.env.JWT_SECRET || "${secret}",
  ${options.usePepper ? 'pepper: process.env.JWT_PEPPER || "",' : ''}
  
  // Global Security Configurations
  session: {
    expires: "15m",
    refreshExpires: "7d",
    enforceStrictRevocation: ${options.useStrictRevocation ? 'true' : 'false'}
  },
  
  // Custom JWT Payload logic
  jwt: {
    payload: (user: any, type: "access" | "refresh") => {
      if (type === "access") {
        return {
          role: user.role,
          // schoolId: user.schoolId 
        };
      }
      return {};
    }
  },

  ${options.useRateLimit ? `rateLimit: {
    max: 100, // Requests per minute
    windowMs: 60 * 1000
  },` : ''}
  ${options.useIPBlocking ? `ipBlocking: {
    maxStrikes: 5,
    blockDurationMs: 15 * 60 * 1000
  },` : ''}
  passwordPolicy: {
    minLength: 6,
    requireUppercase: true,
    requireSpecialCharacter: true
  }
});
`;

function getAdapterImportBlock(adapter: string) {
  switch (adapter) {
    case 'mongoose':
      return `import { createMongoAdapter, createRateLimitModel } from "kroxt/adapters/mongoose";\nimport mongoose from "mongoose";`;
    case 'prisma':
      return `import { createPrismaAdapter } from "kroxt/adapters/prisma";`;
    case 'drizzle':
      return `import { createDrizzleAdapter } from "kroxt/adapters/drizzle";\nimport { eq } from "drizzle-orm";`;
    case 'memory':
      return `import { createMemoryAdapter } from "kroxt/adapters/memory";`;
    default:
      return '';
  }
}

function getAdapterInitialization(adapter: string, options: any) {
  const modelImported = options.createModel;
  switch (adapter) {
    case 'mongoose':
      return `${modelImported ? 'import { User } from "./user.model.js";' : '// import { User } from "./user.model.js";'}\n\n// The rate limit model is optional but recommended\nconst authAdapter = createMongoAdapter(User, createRateLimitModel(mongoose));`;
    case 'prisma':
      return `// import { prisma } from "./lib/prisma";\nconst authAdapter = createPrismaAdapter(prisma.user);`;
    case 'drizzle':
      return `${modelImported ? 'import { db } from "./index.js";\nimport { users } from "./schema.js";' : '// import { db } from "./index";\n// import { users } from "./schema";'}\n\nconst authAdapter = createDrizzleAdapter(db, users, eq);`;
    case 'memory':
      return `const authAdapter = createMemoryAdapter();`;
    default:
      return `// const authAdapter = ...;`;
  }
}

export const userModelTemplate = (adapter: string) => {
  switch (adapter) {
    case 'mongoose':
      return `import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
`;
    case 'drizzle':
      return `import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
`;
    case 'prisma':
      return `// Add this to your schema.prisma file:

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
`;
    default:
      return '';
  }
};

export const envTemplate = (secret: string, usePepper: boolean) => `
# Kroxt Auth Secrets
JWT_SECRET="${secret}"
${usePepper ? `JWT_PEPPER="${crypto.randomBytes(16).toString('hex')}"` : ''}
`;

export const tsConfigTemplate = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
`;
