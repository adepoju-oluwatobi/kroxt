import { createAuth } from "../auth/core/index.js";
import { createMemoryAdapter } from "../auth/adapters/memory.js";
import * as argon2 from "argon2";

async function verify() {
    console.log("Starting Session Revocation Test...");

    const adapter = createMemoryAdapter();
    const auth = createAuth({ adapter, secret: "test-secret" });

    console.log("Creating test user...");
    const { user, refreshToken } = await auth.signup({
        email: "compromised@example.com",
    } as any, "old_password");

    console.log("\nSimulating standard refresh (Before password change)...");
    try {
        const { accessToken } = await auth.refresh(refreshToken);
        if (accessToken) console.log("✅ Successfully refreshed access token.");
    } catch (e: any) {
        console.error("FAILED: Should have successfully refreshed:", e.message);
        process.exit(1);
    }

    console.log("\nSimulating Account Compromise Defense (Password changed)...");
    // Manually mutate the password hash like an adapter would
    const newHash = await argon2.hash("secure_new_password_123");
    
    // Using the internal memory adapter bypass to edit the user directly
    const memUser = await adapter.findUserByEmail("compromised@example.com");
    if (memUser) {
        memUser.passwordHash = newHash;
    }

    console.log("\nSimulating malicious refresh (After password change)...");
    try {
        await auth.refresh(refreshToken);
        throw new Error("Refresh token should have been permanently invalidated!");
    } catch (e: any) {
        if (e.message === "Session revoked (Password changed)") {
            console.log("✅ Successfully caught Revocation error. Stolen Refresh token is dead.");
        } else {
            console.error("FAILED: Expected revocation error, got:", e.message);
            process.exit(1);
        }
    }

    console.log("\n✅ ALL SESSION REVOCATION TESTS PASSED!");
}

verify().catch(console.error);
