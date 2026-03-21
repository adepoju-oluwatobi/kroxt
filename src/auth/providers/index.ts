import { GitHub as ArcticGitHub, Google as ArcticGoogle } from "arctic";

export interface ProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectURI?: string;
}

export interface Provider {
    id: string;
    handler: any; // `arctic` provider instance
}

export function GitHub(config: ProviderConfig): Provider {
    return {
        id: "github",
        handler: new ArcticGitHub(config.clientId, config.clientSecret, null),
    };
}

export function Google(config: ProviderConfig): Provider {
    if (!config.redirectURI) {
        throw new Error("redirectURI is required for Google OAuth provider");
    }
    return {
        id: "google",
        handler: new ArcticGoogle(
            config.clientId,
            config.clientSecret,
            config.redirectURI
        ),
    };
}
