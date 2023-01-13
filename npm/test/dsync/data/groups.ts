const groups = [
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: 'Developers',
    members: [],
  },
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: 'Designers',
    members: [],
  },
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: 'Managers',
    members: [
      {
        value: '65f060e6-7298-4211-9608-b2dec46d85e0',
        display: 'member1@boxyhq.com',
      },
      {
        value: 'fa25354f-cdfa-4bdf-9c28-6eb8f55def9d',
        display: 'member2@boxyhq.com',
      },
    ],
  },
];

export default groups;
