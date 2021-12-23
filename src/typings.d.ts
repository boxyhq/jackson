export type IdPConfig = {
    defaultRedirectUrl: string;
    redirectUrl: string;
    tenant: string;
    product: string;
    rawMetadata: string
}

// TODO: Need a better interface name
export interface Client {
    client_id: string
    client_secret: string
    provider: string
}

// TODO: Suggest an interface name
export type IABC = {
    clientID: string
    clientSecret?: string
    tenant?: string
    product?: string
} | {
    clientID?: string
    clientSecret?: string
    tenant: string
    product: string
}
