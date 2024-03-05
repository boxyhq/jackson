import SAMLFederation from '.';

export type ISAMLFederationController = Awaited<ReturnType<typeof SAMLFederation>>;

export type AttributeMapping = {
  key: string;
  value: string;
};

export type SAMLFederationApp = {
  id: string;
  type?: string;
  clientID?: string;
  clientSecret?: string;
  redirectUrl?: string[] | string;
  name: string;
  tenant: string;
  product: string;
  acsUrl: string;
  entityId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  tenants?: string[]; // To support multiple tenants for a single app
  mappings?: AttributeMapping[] | null;
};

export type SAMLFederationAppWithMetadata = SAMLFederationApp & {
  metadata: {
    entityId: string;
    ssoUrl: string;
    x509cert: string;
    xml: string;
  };
};

export type AppRequestParams =
  | {
      id: string;
    }
  | {
      tenant: string;
      product: string;
      type?: string;
    };
