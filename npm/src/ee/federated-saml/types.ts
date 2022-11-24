import SAMLFederation from '.';

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;

export type SAMLFederationApp = {
  id: string;
  name: string;
  tenant: string;
  product: string;
  acsUrl: string;
  entityId: string;
};

export type SAMLFederationAppWithMetadata = SAMLFederationApp & {
  metadata: {
    entityId: string;
    ssoUrl: string;
    x509cert: string;
    xml: string;
  };
};
