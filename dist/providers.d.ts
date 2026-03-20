export interface ProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectURI?: string;
}
export interface Provider {
    id: string;
    handler: any;
}
export declare function GitHub(config: ProviderConfig): Provider;
export declare function Google(config: ProviderConfig): Provider;
//# sourceMappingURL=providers.d.ts.map