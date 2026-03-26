import { createAuth } from "../auth/core/index.js";
import { createMemoryAdapter } from "../auth/adapters/memory.js";

async function verify() {
    console.log("Starting Rate Limiting Integration Test...");

    const adapter = createMemoryAdapter();
    
    // Create auth with a strict rate limit
    const auth = createAuth({
        adapter,
        secret: "test-secret-12345678901234567890123456789012",
        rateLimit: {
            windowMs: 1000, // 1 second
            max: 3 // Max 3 logins per second
        }
    });

    console.log("Creating test user...");
    await auth.signup({
        email: "rate@example.com",
    } as any, "password123");

    console.log("Testing rate limits...");
    let success = true;
    let allowedCount = 0;
    let blockedCount = 0;

    // We will attempt 5 logins rapidly. The first 3 should succeed, the last 2 should fail.
    for (let i = 0; i < 5; i++) {
        try {
            await auth.loginWithPassword("rate@example.com", "password123");
            allowedCount++;
        } catch (err: any) {
            if (err.message === "Too many requests, please try again later.") {
                blockedCount++;
            } else {
                console.error(`Unexpected error during login attempt ${i + 1}:`, err);
                success = false;
            }
        }
    }

    console.log(`Allowed: ${allowedCount}, Blocked: ${blockedCount}`);

    if (allowedCount !== 3) {
        console.error(`FAILED: Expected exactly 3 allowed logins, but got ${allowedCount}`);
        success = false;
    }

    if (blockedCount !== 2) {
        console.error(`FAILED: Expected exactly 2 blocked logins, but got ${blockedCount}`);
        success = false;
    }

    console.log("Waiting for window to reset (1.2 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 1200));

    console.log("Testing if limits reset successfully...");
    try {
        await auth.loginWithPassword("rate@example.com", "password123");
        console.log("Login successful after window reset.");
    } catch (err: any) {
        console.error("FAILED to login after window reset:", err.message);
        success = false;
    }

    if (success) {
        console.log("\n✅ ALL RATE LIMIT TESTS PASSED!");
    } else {
        console.log("\n❌ SOME RATE LIMIT TESTS FAILED!");
        process.exit(1);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
