import { createAuth } from "../auth/core/index.js";
import { createMemoryAdapter } from "../auth/adapters/memory.js";

async function verify() {
    console.log("Starting Automatic IP Blocking Test...");

    const adapter = createMemoryAdapter();
    
    // Create auth with a strict rate limit and IP blocking
    const auth = createAuth({
        adapter,
        secret: "test-secret",
        rateLimit: {
            windowMs: 4000, 
            max: 2 
        },
        ipBlocking: {
            maxStrikes: 3, // Block after 3 strikes
            blockDurationMs: 60000 // Block for 1 minute
        }
    });

    console.log("Creating test user...");
    await auth.signup({
        email: "test@example.com",
    } as any, "password123");
    await auth.signup({
        email: "other@example.com",
    } as any, "password123");

    console.log("\nSimulating Strike 1 (2 successful, then 1 blocked)...");
    const ip = "192.168.1.100";
    
    await auth.loginWithPassword("test@example.com", "password123", ip);
    await auth.loginWithPassword("test@example.com", "password123", ip);
    try {
        await auth.loginWithPassword("test@example.com", "password123", ip);
    } catch (e: any) {
        if (e.message !== "Too many requests, please try again later.") throw e;
        console.log("Logged strike 1 correctly");
    }
    console.log("Strike Record:", await adapter.getRateLimit?.('strike_' + ip));

    console.log("Waiting 4.2 seconds for rate limit window to reset...");
    await new Promise(resolve => setTimeout(resolve, 4200));

    console.log("\nSimulating Strike 2...");
    await auth.loginWithPassword("test@example.com", "password123", ip);
    await auth.loginWithPassword("test@example.com", "password123", ip);
    try {
        await auth.loginWithPassword("test@example.com", "password123", ip);
    } catch (e: any) {
        if (e.message !== "Too many requests, please try again later.") throw e;
        console.log("Logged strike 2 correctly");
    }
    console.log("Strike Record:", await adapter.getRateLimit?.('strike_' + ip));

    console.log("Waiting 4.2 seconds for rate limit window to reset...");
    await new Promise(resolve => setTimeout(resolve, 4200));

    console.log("\nSimulating Strike 3...");
    await auth.loginWithPassword("test@example.com", "password123", ip);
    await auth.loginWithPassword("test@example.com", "password123", ip);
    try {
        await auth.loginWithPassword("test@example.com", "password123", ip);
    } catch (e: any) {
        if (e.message !== "Too many requests, please try again later.") throw e;
        console.log("Logged strike 3 correctly");
    }
    console.log("Strike Record:", await adapter.getRateLimit?.('strike_' + ip));

    console.log("\nTesting if IP is now completely blocked...");
    console.log("Current Strike Record before testing block:", await adapter.getRateLimit?.('strike_' + ip));
    
    try {
        // Expected to fail instantly since the IP has 3 strikes
        await auth.loginWithPassword("other@example.com", "password123", ip);
        throw new Error("Should have been blocked!");
    } catch (e: any) {
        if (e.message === "IP is temporarily blocked.") {
            console.log("✅ Successfully caught IP Blocked error.");
        } else {
            console.error("FAILED: Expected IP blocked error, got:", e.message);
            process.exit(1);
        }
    }

    console.log("\nTesting if a different IP can still log in...");
    try {
        await auth.loginWithPassword("other@example.com", "password123", "10.0.0.5");
        console.log("✅ Different IP logged in successfully.");
    } catch (e: any) {
        console.error("FAILED: Different IP should not be blocked:", e.message);
        process.exit(1);
    }

    console.log("\n✅ ALL IP BLOCKING TESTS PASSED!");
}

verify().catch(console.error);
