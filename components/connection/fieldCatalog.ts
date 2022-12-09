/**
 * Edit view will have extra fields to render parsed metadata and other attributes.
 * All fields are editable unless they have `editable` set to false.
 * All fields are required unless they have `required` set to false.
 * `accessor` only used to set initial state and retrieve saved value. Useful when key is different from retrieved payload.
 */

export const getCommonFields = (selfSSOSetup: boolean, isEditView?: boolean) => [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'MyApp',
    attributes: { required: false },
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'A short description not more than 100 characters',
    attributes: { maxLength: 100, required: false },
  },
  {
    key: 'tenant',
    label: 'Tenant',
    type: 'text',
    placeholder: 'acme.com',
    attributes: {
      editable: !(isEditView || selfSSOSetup),
      isHidden: (): boolean => (selfSSOSetup ? selfSSOSetup : false),
    },
  },
  {
    key: 'product',
    label: 'Product',
    type: 'text',
    placeholder: 'demo',
    attributes: {
      editable: !(isEditView || selfSSOSetup),
      isHidden: (): boolean => (selfSSOSetup ? selfSSOSetup : false),
    },
  },
  {
    key: 'redirectUrl',
    label: 'Allowed redirect URLs (newline separated)',
    type: 'textarea',
    placeholder: 'http://localhost:3366',
    attributes: { isArray: true, rows: 3 },
  },
  {
    key: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    type: 'url',
    placeholder: 'http://localhost:3366/login/saml',
    attributes: {},
  },

  {
    key: 'oidcDiscoveryUrl',
    label: 'Well-known URL of OpenId Provider',
    type: 'url',
    placeholder: 'https://example.com/.well-known/openid-configuration',
    attributes: isEditView
      ? { connection: 'oidc', accessor: (o) => o?.oidcProvider?.discoveryUrl }
      : { connection: 'oidc' },
  },
  {
    key: 'oidcClientId',
    label: 'Client ID [OIDC Provider]',
    type: 'text',
    placeholder: '',
    attributes: isEditView
      ? { editable: false, connection: 'oidc', accessor: (o) => o?.oidcProvider?.clientId }
      : { connection: 'oidc' },
  },
  {
    key: 'oidcClientSecret',
    label: 'Client Secret [OIDC Provider]',
    type: 'text',
    placeholder: '',
    attributes: isEditView
      ? { connection: 'oidc', accessor: (o) => o?.oidcProvider?.clientSecret }
      : { connection: 'oidc' },
  },
  {
    key: 'rawMetadata',
    label: `Raw IdP XML ${isEditView ? '(fully replaces the current one)' : ''}`,
    type: 'textarea',
    placeholder: 'Paste the raw XML here',
    attributes: {
      rows: 5,
      required: false,
      connection: 'saml',
    },
  },
  {
    key: 'metadataUrl',
    label: `Metadata URL ${isEditView ? '(fully replaces the current one)' : ''}`,
    type: 'url',
    placeholder: 'Paste the Metadata URL here',
    attributes: {
      required: false,
      connection: 'saml',
    },
  },
  {
    key: 'forceAuthn',
    label: 'Force Authentication',
    type: 'checkbox',
    attributes: { required: false, connection: 'saml' },
  },
];

export const EditViewOnlyFields = [
  {
    key: 'idpMetadata',
    label: 'IdP Metadata',
    type: 'pre',
    attributes: {
      isArray: false,
      rows: 10,
      editable: false,
      connection: 'saml',
      formatForDisplay: (value) => {
        const obj = JSON.parse(JSON.stringify(value));
        delete obj.validTo;
        return JSON.stringify(obj, null, 2);
      },
    },
  },
  {
    key: 'idpCertExpiry',
    label: 'IdP Certificate Validity',
    type: 'pre',
    attributes: {
      isHidden: (value): boolean => !value.validTo || new Date(value.validTo).toString() == 'Invalid Date',
      rows: 10,
      editable: false,
      connection: 'saml',
      accessor: (o) => o?.idpMetadata?.validTo,
      showWarning: (value) => new Date(value) < new Date(),
      formatForDisplay: (value) => new Date(value).toString(),
    },
  },
  {
    key: 'clientID',
    label: 'Client ID',
    type: 'text',
    attributes: { editable: false },
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    attributes: { editable: false },
  },
];
