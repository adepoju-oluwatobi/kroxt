"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var core_exports = {};
__export(core_exports, {
  createAuth: () => createAuth,
  generateSecret: () => generateSecret
});
module.exports = __toCommonJS(core_exports);
var argon2 = __toESM(require("argon2"), 1);
var import_jose = require("jose");
var import_crypto = __toESM(require("crypto"), 1);
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
    return new import_jose.SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(type === "access" ? expiration : refreshExpiration).sign(encodedSecret);
  }
  async function verifyToken(token, expectedType = "access") {
    try {
      const { payload } = await (0, import_jose.jwtVerify)(token, encodedSecret);
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
  return import_crypto.default.getRandomValues(new Uint8Array(length));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAuth,
  generateSecret
});
//# sourceMappingURL=core.cjs.map
