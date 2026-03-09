import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
export function createAuth(options) {
    const { adapter, secret, session, providers } = options;
    const encodedSecret = new TextEncoder().encode(secret);
    const expiration = session?.expires || "7d";
    /**
     * Generates a stateless JWT for a user session
     */
    async function generateToken(user) {
        return new SignJWT({ sub: user.id, role: user.role })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(expiration)
            .sign(encodedSecret);
    }
    /**
     * Verifies a JWT and returns the payload
     */
    async function verifyToken(token) {
        try {
            const { payload } = await jwtVerify(token, encodedSecret);
            return payload;
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Signup with a new user payload (handles extended schemas out-of-the-box).
     * Generates a password hash if password is provided.
     */
    async function signup(userData, password) {
        let dataToSave = { ...userData };
        if (password) {
            dataToSave.passwordHash = await argon2.hash(password);
        }
        const newUser = await adapter.createUser(dataToSave);
        const token = await generateToken(newUser);
        return { user: newUser, token };
    }
    /**
     * Standard Email/Password Login
     */
    async function loginWithPassword(email, password) {
        const user = await adapter.findUserByEmail(email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        if (!user.passwordHash) {
            throw new Error("User does not have a password setup. Did they use OAuth?");
        }
        const isValid = await argon2.verify(user.passwordHash, password);
        if (!isValid) {
            throw new Error("Invalid credentials");
        }
        const token = await generateToken(user);
        return { user, token };
    }
    return {
        signup,
        loginWithPassword,
        verifyToken,
        generateToken,
        _providers: providers // Exposing to internal router mechanisms if needed
    };
}
//# sourceMappingURL=core.js.map