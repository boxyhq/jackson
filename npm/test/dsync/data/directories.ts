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
];

export default directories;
