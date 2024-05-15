export const azureUser = {
  schemas: [
    'urn:ietf:params:scim:schemas:core:2.0:User',
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
  ],
  externalId: 'jackson',
  userName: 'jackson@boxyhq.onmicrosoft.com',
  active: true,
  displayName: 'Jackson',
  emails: [{ primary: true, type: 'work', value: 'jackson@example.com' }],
  meta: { resourceType: 'User' },
  name: { formatted: 'givenName familyName', familyName: 'familyName', givenName: 'givenName' },
  title: 'Manager',
};

export const azureGroup = {
  schemas: [
    'urn:ietf:params:scim:schemas:core:2.0:Group',
    'http://schemas.microsoft.com/2006/11/ResourceManagement/ADSCIM/2.0/Group',
  ],
  externalId: '8aa1a0c0-c4c3-4bc0-b4a5-2ef676900159',
  displayName: 'BoxyHQ',
  meta: {
    resourceType: 'Group',
  },
};
