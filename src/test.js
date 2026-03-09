import { createAuth } from "./auth/index.js";
// 2. Mock database
const mockDb = new Map();
// 3. Create the adapter
const myAdapter = {
    createUser: async (data) => {
        const id = Date.now().toString();
        const newUser = { id, ...data };
        mockDb.set(newUser.email, newUser);
        return newUser;
    },
    findUserByEmail: async (email) => mockDb.get(email) || null,
    findUserById: async (id) => {
        for (const user of mockDb.values()) {
            if (user.id === id)
                return user;
        }
        return null;
    },
    linkOAuthAccount: async () => { }, // mock
};
// 4. Initialize Auth Engine
const auth = createAuth({
    adapter: myAdapter,
    secret: "super-secret-key-1234567890",
    session: { expires: "1h" },
});
async function runTest() {
    console.log("--- Starting Auth Test ---");
    // TEST SIGNUP
    const sampleRegisterData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "landlord",
        nin: "12345678901",
    };
    const { user, token } = await auth.signup(sampleRegisterData, "password123");
    console.log("1. Signup successful!");
    console.log("Returned User:", { ...user, passwordHash: "***hidden***" });
    console.log("Returned JWT Token:", token.substring(0, 30) + "...");
    // TEST JWT VERIFY
    const payload = await auth.verifyToken(token);
    console.log("2. Token Verified! Payload:", payload);
    // TEST LOGIN
    const loginResult = await auth.loginWithPassword("test@example.com", "password123");
    console.log("3. Login successful!");
    console.log("Login User:", { ...loginResult.user, passwordHash: "***hidden***" });
    try {
        await auth.loginWithPassword("test@example.com", "wrongpassword");
        console.log("Error: Expected login to fail with wrong password!");
    }
    catch (err) {
        console.log("4. Login rejected wrong password successfully. Message:", err.message);
    }
    console.log("--- Auth Test Completed ---");
}
runTest().catch((err) => {
    console.error("Test failed:", err);
});
//# sourceMappingURL=test.js.map