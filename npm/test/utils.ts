import { JacksonOption } from '../src/typings';

export const getDatabaseOption = () => {
  return {
    externalUrl: 'https://my-cool-app.com',
    samlAudience: 'https://saml.boxyhq.com',
    samlPath: '/sso/oauth/saml',
    db: {
      engine: 'mem',
    },
  } as JacksonOption;
};
