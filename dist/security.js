import crypto from "crypto";
function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}
function verifyCsrf(tokenInRequest, tokenInCookie) {
  if (!tokenInRequest || !tokenInCookie) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenInRequest),
      Buffer.from(tokenInCookie)
    );
  } catch {
    return false;
  }
}
export {
  generateCsrfToken,
  verifyCsrf
};
//# sourceMappingURL=security.js.map
