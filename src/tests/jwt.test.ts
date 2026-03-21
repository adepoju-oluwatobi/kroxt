import { createAuth } from "../auth/core/index.js";
import { createMemoryAdapter } from "../auth/adapters/memory.js";

async function verify() {
    console.log("Starting JWT Payload Customization Verification...");

    const adapter = createMemoryAdapter();
    const auth = createAuth({
        adapter,
        secret: "test-secret-12345678901234567890123456789012",
        jwt: {
            payload: (user, type) => ({
                schoolId: (user as any).schoolId,
                customRole: user.role,
                isAccess: type === "access",
                // sub: "custom-sub-value" // Uncomment to test sub override
            })
        }
    });

    console.log("Signing up a user with extra fields...");
    const { user, accessToken } = await auth.signup({
        email: "test@example.com",
        role: "admin",
        schoolId: "SCHOOL_123"
    } as any, "password123");

    console.log("Verifying token...");
    const payload = await auth.verifyToken(accessToken, "access");

    if (!payload) {
        console.error("FAILED: Token verification returned null");
        process.exit(1);
    }

    console.log("Decoded Payload:", JSON.stringify(payload, null, 2));

    let success = true;

    if (payload["schoolId"] !== "SCHOOL_123") {
        console.error(`FAILED: Expected schoolId 'SCHOOL_123', got '${payload["schoolId"]}'`);
        success = false;
    }

    if (payload["customRole"] !== "admin") {
        console.error(`FAILED: Expected customRole 'admin', got '${payload["customRole"]}'`);
        success = false;
    }

    if (payload["isAccess"] !== true) {
        console.error(`FAILED: Expected isAccess true, got '${payload["isAccess"]}'`);
        success = false;
    }

    if (payload.sub !== user.id) {
        console.error(`FAILED: Expected sub to be user id '${user.id}', got '${payload.sub}'`);
        success = false;
    }

    // Test sub override
    console.log("\nTesting sub override...");
    const authWithOverride = createAuth({
        adapter,
        secret: "test-secret-12345678901234567890123456789012",
        jwt: {
            payload: () => ({
                sub: "OVERRIDDEN_SUB"
            })
        }
    });

    const { accessToken: tokenWithOverride } = await authWithOverride.loginWithPassword("test@example.com", "password123");
    const payloadWithOverride = await authWithOverride.verifyToken(tokenWithOverride, "access");

    if (!payloadWithOverride) {
        console.error("FAILED: Token with override verification returned null");
        process.exit(1);
    }

    console.log("Decoded Payload (with override):", JSON.stringify(payloadWithOverride, null, 2));

    if (payloadWithOverride.sub !== "OVERRIDDEN_SUB") {
        console.error(`FAILED: Expected overridden sub 'OVERRIDDEN_SUB', got '${payloadWithOverride.sub}'`);
        success = false;
    }

    if (success) {
        console.log("\n✅ ALL TESTS PASSED!");
    } else {
        console.log("\n❌ SOME TESTS FAILED!");
        process.exit(1);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
