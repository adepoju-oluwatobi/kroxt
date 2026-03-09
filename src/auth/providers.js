import { GitHub as ArcticGitHub, Google as ArcticGoogle } from "arctic";
export function GitHub(config) {
    return {
        id: "github",
        handler: new ArcticGitHub(config.clientId, config.clientSecret, null),
    };
}
export function Google(config) {
    if (!config.redirectURI) {
        throw new Error("redirectURI is required for Google OAuth provider");
    }
    return {
        id: "google",
        handler: new ArcticGoogle(config.clientId, config.clientSecret, config.redirectURI),
    };
}
//# sourceMappingURL=providers.js.map