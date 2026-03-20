import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
function createAuth(options) {
  const { adapter, secret, pepper, session, providers } = options;
  const encodedSecret = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  const expiration = session?.expires || "1h";
  const refreshExpiration = session?.refreshExpires || "7d";
  async function generateToken(user, type = "access") {
    let payload = { sub: user.id, role: user.role, type };
    if (options.jwt?.payload) {
      const customPayload = options.jwt.payload(user, type);
      payload = { ...payload, ...customPayload };
    }
    return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(type === "access" ? expiration : refreshExpiration).sign(encodedSecret);
  }
  async function verifyToken(token, expectedType = "access") {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      if (payload.type !== expectedType) return null;
      return payload;
    } catch (e) {
      return null;
    }
  }
  async function refresh(refreshToken) {
    const payload = await verifyToken(refreshToken, "refresh");
    if (!payload || !payload.sub) {
      throw new Error("Invalid or expired refresh token");
    }
    const user = await adapter.findUserById(payload.sub);
    if (!user) {
      throw new Error("User not found");
    }
    const accessToken = await generateToken(user, "access");
    return { accessToken };
  }
  async function signup(userData, password) {
    let dataToSave = { ...userData };
    if (password) {
      const passwordWithPepper = pepper ? `${password}${pepper}` : password;
      dataToSave.passwordHash = await argon2.hash(passwordWithPepper);
    }
    const newUser = await adapter.createUser(dataToSave);
    const accessToken = await generateToken(newUser, "access");
    const refreshToken = await generateToken(newUser, "refresh");
    return { user: newUser, accessToken, refreshToken };
  }
  async function loginWithPassword(email, password) {
    const user = await adapter.findUserByEmail(email);
    const dummyHash = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RytpInY7i6C9M5l0D4n8Q+7j/J+i";
    const targetHash = user?.passwordHash || dummyHash;
    const passwordWithPepper = pepper ? `${password}${pepper}` : password;
    const isValid = await argon2.verify(targetHash, passwordWithPepper);
    if (!user || !user.passwordHash || !isValid) {
      throw new Error("Invalid credentials");
    }
    const accessToken = await generateToken(user, "access");
    const refreshToken = await generateToken(user, "refresh");
    return { user, accessToken, refreshToken };
  }
  return {
    signup,
    loginWithPassword,
    refresh,
    verifyToken,
    generateToken,
    _providers: providers
  };
}
function generateSecret(length = 32) {
  return crypto.getRandomValues(new Uint8Array(length));
}
export {
  createAuth,
  generateSecret
};
//# sourceMappingURL=core.js.map
