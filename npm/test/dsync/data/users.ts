const users = [
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: 'jackson@boxyhq.com',
    name: {
      givenName: 'Jackson',
      familyName: 'M',
    },
    emails: [
      {
        primary: true,
        value: 'jackson@boxyhq.com',
        type: 'work',
      },
    ],
    displayName: 'Jackson M',
    locale: 'en-US',
    externalId: '00u5b1hpjh9tGaknX5d7',
    groups: [],
    active: true,
  },
];

export default users;
