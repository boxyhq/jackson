import { Directory } from '../../../src/typings';

const directories = <Directory[]>[
  {
    name: 'BoxyHQ',
    tenant: 'boxyhq.com',
    product: 'jackson',
    type: 'okta-scim-v2',
    log_webhook_events: false,
  },
  {
    name: 'Cal',
    tenant: 'cal.com',
    product: 'jackson',
    type: 'okta-saml',
    log_webhook_events: false,
  },
  {
    name: 'Aviyel',
    tenant: 'aviyel.com',
    product: 'jackson',
    type: 'okta-saml',
    log_webhook_events: false,
    webhook: {
      endpoint: 'https://eoproni1f0eod8i.m.pipedream.net',
      secret: 'secret',
    },
  },
];

export default directories;
