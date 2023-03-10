import { metrics } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

/* A specific implementation of LoggerProvider comes from an SDK */
const api = logs; //LogsAPI.getInstance();
const loggerProvider = api.getLoggerProvider();

/* Initialize LoggerProvider */
api.setGlobalLoggerProvider(loggerProvider);
/* returns loggerProvider (no-op if a working provider has not been initialized) */
api.getLoggerProvider();
/* returns a logger from the registered global logger provider (no-op if a working provider has not been initialized) */
const logger = api.getLogger('Jackson');

let meter = metrics.getMeterProvider().getMeter('jackson');
let counters;

const increment = (action: string) => {
  log(action);
  const counter = counters[action];
  if (counter) {
    counter.add(1);
  }
};

const init = () => {
  meter = metrics.getMeterProvider().getMeter('jackson');

  counters = {
    createConnection: meter.createCounter('jackson.connection.create', {
      description: 'Number of IdP connection create requests',
    }),

    getConnections: meter.createCounter('jackson.connection.get', {
      description: 'Number of IdP connections get requests',
    }),

    deleteConnections: meter.createCounter('jackson.connection.delete', {
      description: 'Number of IdP connections delete requests',
    }),

    oauthAuthorize: meter.createCounter('jackson.oauth.authorize', {
      description: 'Number of oauth authorize requests',
    }),

    oauthToken: meter.createCounter('jackson.oauth.token', {
      description: 'Number of oauth token requests',
    }),

    oauthUserInfo: meter.createCounter('jackson.oauth.userinfo', {
      description: 'Number of oauth user info requests',
    }),
  };
};

const log = (body) => {
  // logger.emitEvent({ name: name, domain: 'localhost:5225' });
  logger.emitLogRecord({
    severityNumber: SeverityNumber.DEBUG,
    body,
    severityText: 'DEBUG',
    spanId: '' + Math.random() * 1000,
    traceId: '' + Math.random() * 1000,
    timestamp: +new Date(),
    attributes: {
      type: body,
    },
    traceFlags: Math.round(Math.random() * 10),
  });
};

export { increment, init, log };
