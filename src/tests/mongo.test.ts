import { createMongoAdapter } from "../auth/adapters/mongoose.js";

async function verify() {
  console.log("Starting MongoDB Adapter Verification (Mocked)...");

  // A simple mock of a Mongoose model
  const mockModel: any = {
    data: new Map<string, any>(),
    
    create: async (data: any) => {
      const id = "mock_id_" + Date.now();
      const newUser = { ...data, _id: id, toObject: function() { return { ...this }; } };
      mockModel.data.set(id, newUser);
      return newUser;
    },

    findOne: async (query: any) => {
      for (const user of mockModel.data.values()) {
        if (user.email === query.email) return user;
      }
      return null;
    },

    findById: async (id: string) => {
      return mockModel.data.get(id) || null;
    },

    findByIdAndUpdate: async (id: string, update: any) => {
      const user = mockModel.data.get(id);
      if (user) {
        Object.assign(user, update);
      }
      return user;
    }
  };

  const adapter = createMongoAdapter(mockModel);

  console.log("Testing createUser...");
  const user = await adapter.createUser({ email: "mongo@example.com", name: "Mongo User" });
  if (!user.id || user.email !== "mongo@example.com") {
    console.error("FAILED: createUser returned invalid user", user);
    process.exit(1);
  }
  console.log("✅ createUser Passed, ID:", user.id);

  console.log("Testing findUserByEmail...");
  const foundByEmail = await adapter.findUserByEmail("mongo@example.com");
  if (!foundByEmail || foundByEmail.id !== user.id) {
    console.error("FAILED: findUserByEmail failed");
    process.exit(1);
  }
  console.log("✅ findUserByEmail Passed");

  console.log("Testing findUserById...");
  const foundById = await adapter.findUserById(user.id);
  if (!foundById || foundById.email !== "mongo@example.com") {
    console.error("FAILED: findUserById failed");
    process.exit(1);
  }
  console.log("✅ findUserById Passed");

  console.log("Testing linkOAuthAccount...");
  await adapter.linkOAuthAccount(user.id, "github", "gh_123");
  const updatedUser: any = await adapter.findUserById(user.id);
  if (updatedUser.oauthProvider !== "github" || updatedUser.oauthId !== "gh_123") {
    console.error("FAILED: linkOAuthAccount failed");
    process.exit(1);
  }
  console.log("✅ linkOAuthAccount Passed");

  console.log("\n🚀 ALL MONGO ADAPTER TESTS PASSED!");
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
