/**
 * Edit view will have extra fields to render parsed metadata and other attributes.
 * All fields are editable unless they have `editable` set to false.
 * All fields are required unless they have `required` set to false.
 * `accessor` - only used to set initial state and retrieve saved value. Useful when key is different from retrieved payload.
 * `fallback` - use this key to activate a fallback catalog item that will take in the values. The fallback will be activated
 *  by means of a switch control in the UI that allows us to deactivate the fallback catalog item and revert to the main field.
 */

import type { FieldCatalogItem } from './utils';

export const getCommonFields = ({
  isEditView,
  isSettingsView,
}: {
  isEditView?: boolean;
  isSettingsView?: boolean;
}): FieldCatalogItem[] => [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'MyApp',
    attributes: { required: false, hideInSetupView: true, 'data-testid': 'name' },
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'A short description not more than 100 characters',
    attributes: { maxLength: 100, required: false, hideInSetupView: true },
  },
  {
    key: 'tenant',
    label: 'Tenant',
    type: 'text',
    placeholder: 'acme.com',
    attributes: isEditView
      ? {
          editable: false,
          hideInSetupView: true,
        }
      : {
          editable: !isSettingsView,
          hideInSetupView: true,
        },
  },
  {
    key: 'product',
    label: 'Product',
    type: 'text',
    placeholder: 'demo',
    attributes: isEditView
      ? {
          editable: false,
          hideInSetupView: true,
        }
      : {
          editable: !isSettingsView,
          hideInSetupView: true,
        },
  },
  {
    key: 'redirectUrl',
    label: 'Allowed redirect URLs (newline separated)',
    type: 'textarea',
    placeholder: 'http://localhost:3366',
    attributes: { isArray: true, rows: 3, hideInSetupView: true, editable: !isSettingsView },
  },
  {
    key: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    type: 'url',
    placeholder: 'http://localhost:3366/login/saml',
    attributes: { hideInSetupView: true, editable: !isSettingsView },
  },
  {
    key: 'oidcClientId',
    label: 'Client ID [OIDC Provider]',
    type: 'text',
    placeholder: '',
    attributes: {
      'data-testid': 'oidcClientId',
      connection: 'oidc',
      accessor: (o) => o?.oidcProvider?.clientId,
      hideInSetupView: false,
    },
  },
  {
    key: 'oidcClientSecret',
    label: 'Client Secret [OIDC Provider]',
    type: 'password',
    placeholder: '',
    attributes: {
      'data-testid': 'oidcClientSecret',
      connection: 'oidc',
      accessor: (o) => o?.oidcProvider?.clientSecret,
      hideInSetupView: false,
    },
  },
  {
    key: 'oidcDiscoveryUrl',
    label: 'Well-known URL of OpenID Provider',
    type: 'url',
    placeholder: 'https://example.com/.well-known/openid-configuration',
    attributes: {
      'data-testid': 'oidcDiscoveryUrl',
      connection: 'oidc',
      accessor: (o) => o?.oidcProvider?.discoveryUrl,
      hideInSetupView: false,
    },
    fallback: {
      key: 'oidcMetadata',
      activateCondition: (fieldValue) => !fieldValue,
      switch: {
        label: 'Missing the discovery URL? Click here to set the individual attributes',
        'data-testid': 'oidcDiscoveryUrl-fallback-switch',
      },
    },
  },
  {
    key: 'oidcMetadata',
    type: 'object',
    members: [
      {
        key: 'issuer',
        label: 'Issuer',
        type: 'url',
        attributes: {
          accessor: (o) => o?.oidcProvider?.metadata?.issuer,
          hideInSetupView: false,
          'data-testid': 'issuer',
        },
      },
      {
        key: 'authorization_endpoint',
        label: 'Authorization Endpoint',
        type: 'url',
        attributes: {
          accessor: (o) => o?.oidcProvider?.metadata?.authorization_endpoint,
          hideInSetupView: false,
          'data-testid': 'authorization_endpoint',
        },
      },
      {
        key: 'token_endpoint',
        label: 'Token endpoint',
        type: 'url',
        attributes: {
          accessor: (o) => o?.oidcProvider?.metadata?.token_endpoint,
          hideInSetupView: false,
          'data-testid': 'token_endpoint',
        },
      },
      {
        key: 'jwks_uri',
        label: 'JWKS URI',
        type: 'url',
        attributes: {
          accessor: (o) => o?.oidcProvider?.metadata?.jwks_uri,
          hideInSetupView: false,
          'data-testid': 'jwks_uri',
        },
      },
      {
        key: 'userinfo_endpoint',
        label: 'UserInfo endpoint',
        type: 'url',
        attributes: {
          accessor: (o) => o?.oidcProvider?.metadata?.userinfo_endpoint,
          hideInSetupView: false,
          'data-testid': 'userinfo_endpoint',
        },
      },
    ],
    attributes: { connection: 'oidc', hideInSetupView: false },
    fallback: {
      key: 'oidcDiscoveryUrl',
      switch: {
        label: 'Have a discovery URL? Click here to set it',
        'data-testid': 'oidcMetadata-fallback-switch',
      },
    },
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
      hideInSetupView: false,
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
      hideInSetupView: false,
      'data-testid': 'metadataUrl',
    },
  },
  {
    key: 'sortOrder',
    label: 'Sort Order',
    type: 'number',
    placeholder: '10',
    attributes: {
      required: false,
      hideInSetupView: true,
    },
  },
  {
    key: 'forceAuthn',
    label: 'Force Authentication',
    type: 'checkbox',
    attributes: { required: false, connection: 'saml', hideInSetupView: false },
  },
];

export const EditViewOnlyFields: FieldCatalogItem[] = [
  {
    key: 'idpMetadata',
    label: 'IdP Metadata',
    type: 'pre',
    attributes: {
      isArray: false,
      rows: 10,
      editable: false,
      connection: 'saml',
      hideInSetupView: false,
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
      isHidden: (value): boolean => !value || new Date(value).toString() == 'Invalid Date',
      rows: 10,
      editable: false,
      connection: 'saml',
      hideInSetupView: false,
      accessor: (o) => o?.idpMetadata?.validTo,
      showWarning: (value) => new Date(value) < new Date(),
      formatForDisplay: (value) => new Date(value).toString(),
    },
  },
  {
    key: 'clientID',
    label: 'Client ID',
    type: 'text',
    attributes: { editable: false, hideInSetupView: false },
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    attributes: { editable: false, hideInSetupView: false },
  },
];
