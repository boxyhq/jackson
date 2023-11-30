import SAMLFederation from '.';

export type ISAMLFederationController = Awaited<ReturnType<typeof SAMLFederation>>;

export type SAMLFederationApp = {
  id: string;
  name: string;
  tenant: string;
  product: string;
  acsUrl: string;
  entityId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
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
    };

export type FederatedSAMLProfile = {
  email: string;
  firstName: string;
  lastName: string;
  requested: Record<string, string>;
};
