const groupAttribute = 'group';
const groupSchema = 'http://schemas.xmlsoap.org/claims/Group';

const mapping = [
  {
    attribute: 'id',
    schema: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  },
  {
    attribute: 'email',
    schema: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  },
  {
    attribute: 'firstName',
    schema: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  },
  {
    attribute: 'lastName',
    schema: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
  },
  {
    attribute: 'role',
    schema: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  },
  {
    attribute: groupAttribute,
    schema: groupSchema,
  },
] as const;

type attributes = typeof mapping[number]['attribute'];
type schemas = typeof mapping[number]['schema'];

const map = (claims: Record<attributes | schemas, unknown>) => {
  if (claims[groupAttribute]) {
    console.log('claims[groupAttribute]', claims[groupAttribute]);
    claims[groupAttribute] = [].concat(claims[groupAttribute] as any);
  }
  if (claims[groupSchema]) {
    console.log('claims[groupSchema]', claims[groupSchema]);
    claims[groupSchema] = [].concat(claims[groupSchema] as any);
  }

  const profile = {
    raw: claims,
  };

  mapping.forEach((m) => {
    if (claims[m.attribute]) {
      profile[m.attribute] = claims[m.attribute];
    } else if (claims[m.schema]) {
      profile[m.attribute] = claims[m.schema];
    }
  });

  return profile;
};

export default { map };
