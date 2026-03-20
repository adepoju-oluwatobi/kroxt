import { GitHub as ArcticGitHub, Google as ArcticGoogle } from "arctic";
function GitHub(config) {
  return {
    id: "github",
    handler: new ArcticGitHub(config.clientId, config.clientSecret, null)
  };
}
function Google(config) {
  if (!config.redirectURI) {
    throw new Error("redirectURI is required for Google OAuth provider");
  }
  return {
    id: "google",
    handler: new ArcticGoogle(
      config.clientId,
      config.clientSecret,
      config.redirectURI
    )
  };
}
export {
  GitHub,
  Google
};
//# sourceMappingURL=providers.js.map
