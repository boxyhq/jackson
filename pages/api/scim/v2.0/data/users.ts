export const users = {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  totalResults: 3,
  startIndex: 1,
  itemsPerPage: 3,
  Resources: [
    {
      id: '23a35c27-23d3-4c03-b4c5-6443c09e7140',
      userName: 'user+2@boxyhq.com',
      displayName: 'User 2',
      name: {
        givenName: 'givenName',
        familyName: 'familyName',
      },
      // externalId: '00ujl29u0le5T6Aj10h713',
      active: true,
      emails: [
        {
          primary: true,
          value: 'user+2@boxyhq.com',
          type: 'work',
        },
      ],
    },
    {
      id: '23a35c27-23d3-4c03-b4c5-6443c09e7141',
      userName: 'user+3@boxyhq.com',
      displayName: 'User 3',
      name: {
        givenName: 'givenName',
        familyName: 'familyName',
      },
      // externalId: '00ujl29u0le5T6Aj10h712',
      active: true,
      emails: [
        {
          primary: true,
          value: 'user+3@boxyhq.com',
          type: 'work',
        },
      ],
    },
    {
      id: '23a35c27-23d3-4c03-b4c5-6443c09e7142',
      userName: 'kiran@boxyhq.com',
      displayName: 'Kiran K',
      name: {
        givenName: 'givenName',
        familyName: 'familyName',
      },
      // externalId: '00u3e3cmpdDydXdzV5d7',
      active: true,
      emails: [
        {
          primary: true,
          value: 'kiran@boxyhq.com',
          type: 'work',
        },
      ],
    },
  ],
};

export const user = {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  id: '23a35c27-23d3-4c03-b4c5-6443c09e7140',
  userName: 'user+2@boxyhq.com',
  displayName: 'User 2',
  name: {
    givenName: 'givenName',
    familyName: 'familyName',
  },
  active: true,
  emails: [
    {
      primary: true,
      value: 'user+2@boxyhq.com',
      type: 'work',
    },
  ],
};

// const body = await getRawBody(req);
// const payload = JSON.parse(body.toString('utf-8'));
// const { userName, displayName, name } = payload;

// GET /Users
// if (method === 'GET') {
//   return res.json(users);
// }

// return res.json({
//   schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
//   id: '23a35c27-23d3-4c03-b4c5-6443c09e7171',
//   userName,
//   name: {
//     givenName: name.givenName,
//     familyName: name.familyName,
//   },
//   emails: [
//     {
//       primary: true,
//       value: userName,
//       type: 'work',
//     },
//   ],
//   displayName,
//   locale: 'en-US',
//   externalId: '00ujl29u0le5T6Aj10h711',
//   active: true,
//   groups: [],
//   meta: {
//     resourceType: 'User',
//   },
// });
