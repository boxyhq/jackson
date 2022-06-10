import { Directory } from '../../../src/typings';

const directories = <Directory[]>[
  {
    name: 'BoxyHQ',
    tenant: 'boxyhq.com',
    product: 'jackson',
    type: 'okta',
    log_webhook_events: false,
  },
  {
    name: 'Cal',
    tenant: 'cal.com',
    product: 'jackson',
    type: 'onelogin',
    log_webhook_events: false,
  },
];

export default directories;
