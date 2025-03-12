import type {
  DatabaseEngine,
  DatabaseOption,
  DatabaseType,
  JacksonOption,
  SSOTracesOption,
} from '@boxyhq/saml-jackson';

import type { SessionStrategy } from 'next-auth';

const env = {
  databaseUrl: `${process.env.DATABASE_URL}`,
  appUrl: `${process.env.APP_URL}`,
  redirectIfAuthenticated: '/dashboard',
  securityHeadersEnabled: process.env.SECURITY_HEADERS_ENABLED ?? false,

  // SMTP configuration for NextAuth
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  // NextAuth configuration
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    sessionStrategy: 'database' as SessionStrategy,
  },

  // Svix
  svix: {
    url: `${process.env.SVIX_URL}`,
    apiKey: `${process.env.SVIX_API_KEY}`,
  },

  //Social login: Github
  github: {
    clientId: `${process.env.GITHUB_CLIENT_ID}`,
    clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
  },

  //Social login: Google
  google: {
    clientId: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
  },

  // Retraced configuration
  retraced: {
    url: process.env.RETRACED_URL ? `${process.env.RETRACED_URL}/auditlog` : undefined,
    apiKey: process.env.RETRACED_API_KEY,
    projectId: process.env.RETRACED_PROJECT_ID,
  },

  groupPrefix: process.env.GROUP_PREFIX,

  // SAML Jackson configuration
  jackson: {
    url: process.env.JACKSON_URL,
    externalUrl: process.env.JACKSON_EXTERNAL_URL || process.env.JACKSON_URL,
    apiKey: process.env.JACKSON_API_KEY,
    productId: process.env.JACKSON_PRODUCT_ID || 'boxyhq',
    selfHosted: process.env.JACKSON_URL !== undefined,
    sso: {
      callback: `${process.env.APP_URL}`,
      issuer: 'https://saml.boxyhq.com',
      path: '/api/oauth/saml',
      oidcPath: '/api/oauth/oidc',
      idpLoginPath: '/auth/idp-login',
    },
    dsync: {
      webhook_url: `${process.env.APP_URL}/api/webhooks/dsync`,
      webhook_secret: process.env.JACKSON_WEBHOOK_SECRET,
    },
  },

  // Users will need to confirm their email before accessing the app feature
  confirmEmail: process.env.CONFIRM_EMAIL === 'true',

  // Mixpanel configuration
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  disableNonBusinessEmailSignup: process.env.DISABLE_NON_BUSINESS_EMAIL_SIGNUP === 'true',

  authProviders: process.env.AUTH_PROVIDERS || 'github,credentials',

  otel: {
    prefix: process.env.OTEL_PREFIX || 'boxyhq.saas',
  },

  hideLandingPage: process.env.HIDE_LANDING_PAGE === 'true',

  darkModeEnabled: process.env.NEXT_PUBLIC_DARK_MODE !== 'false',

  teamFeatures: {
    sso: process.env.FEATURE_TEAM_SSO !== 'false',
    dsync: process.env.FEATURE_TEAM_DSYNC !== 'false',
    webhook: process.env.FEATURE_TEAM_WEBHOOK !== 'false',
    apiKey: process.env.FEATURE_TEAM_API_KEY !== 'false',
    auditLog: process.env.FEATURE_TEAM_AUDIT_LOG !== 'false',
    payments:
      process.env.FEATURE_TEAM_PAYMENTS === 'false'
        ? false
        : Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    deleteTeam: process.env.FEATURE_TEAM_DELETION !== 'false',
  },

  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY || null,
    secretKey: process.env.RECAPTCHA_SECRET_KEY || null,
  },

  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,

  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
};

export default env;

const samlPath = '/api/oauth/saml';
const oidcPath = '/api/oauth/oidc';
const idpDiscoveryPath = '/idp/select';
const googleDSyncAuthorizePath = '/api/scim/oauth/authorize';
const googleDSyncCallbackPath = '/api/scim/oauth/callback';

const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = Number(process.env.PORT || '5225');
const externalUrl = process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;
const apiKeys = (process.env.JACKSON_API_KEYS || '').split(',');
const acsUrl = process.env.ACS_URL || externalUrl + samlPath;

let ssl;
if (process.env.DB_SSL === 'true') {
  ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

// Retraced
const retraced = {
  hostUrl: process.env.RETRACED_HOST_URL,
  externalUrl: process.env.RETRACED_EXTERNAL_URL || process.env.RETRACED_HOST_URL,
  adminToken: process.env.RETRACED_ADMIN_ROOT_TOKEN,
};

// Terminus
const terminus = {
  hostUrl: process.env.TERMINUS_PROXY_HOST_URL,
  adminToken: process.env.TERMINUS_ADMIN_ROOT_TOKEN,
  retracedProjectId: process.env.TERMINUS_RETRACED_PROJECT_ID,
};

export const setupLinkExpiryDays = process.env.SETUP_LINK_EXPIRY_DAYS
  ? Number(process.env.SETUP_LINK_EXPIRY_DAYS)
  : 3;

const db: DatabaseOption = {
  engine: process.env.DB_ENGINE ? <DatabaseEngine>process.env.DB_ENGINE : undefined,
  url: process.env.DB_URL || process.env.DATABASE_URL,
  type: process.env.DB_TYPE ? <DatabaseType>process.env.DB_TYPE : undefined,
  ttl: process.env.DB_TTL ? Number(process.env.DB_TTL) : undefined,
  cleanupLimit: process.env.DB_CLEANUP_LIMIT ? Number(process.env.DB_CLEANUP_LIMIT) : undefined,
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
  pageLimit: process.env.DB_PAGE_LIMIT ? Number(process.env.DB_PAGE_LIMIT) : undefined,
  ssl,
  dynamodb: {
    region: process.env.DB_DYNAMODB_REGION,
    readCapacityUnits: process.env.DB_DYNAMODB_RCUS ? Number(process.env.DB_DYNAMODB_RCUS) : undefined,
    writeCapacityUnits: process.env.DB_DYNAMODB_RCUS ? Number(process.env.DB_DYNAMODB_WCUS) : undefined,
  },
  manualMigration: process.env.DB_MANUAL_MIGRATION === 'true',
};

// ssoTraces options
const ssoTraces: SSOTracesOption = {
  disable: process.env.SSO_TRACES_DISABLE === 'true',
  redact: process.env.SSO_TRACES_REDACT === 'true',
  ttl: process.env.SSO_TRACES_TTL ? Number(process.env.SSO_TRACES_TTL) * 60 * 60 : undefined,
};

/** Indicates if the Jackson instance is hosted (i.e. not self-hosted) */
export const boxyhqHosted = process.env.BOXYHQ_HOSTED === '1';

const jacksonOptions: JacksonOption = {
  externalUrl,
  samlPath,
  acsUrl,
  oidcPath,
  idpDiscoveryPath,
  samlAudience: process.env.SAML_AUDIENCE,
  preLoadedConnection: process.env.PRE_LOADED_CONNECTION || process.env.PRE_LOADED_CONFIG,
  idpEnabled: process.env.IDP_ENABLED === 'true',
  db,
  clientSecretVerifier: process.env.CLIENT_SECRET_VERIFIER,
  openid: {
    jwsAlg: process.env.OPENID_JWS_ALG,
    jwtSigningKeys: {
      private: process.env.OPENID_RSA_PRIVATE_KEY || '',
      public: process.env.OPENID_RSA_PUBLIC_KEY || '',
    },
    requestProfileScope: process.env.OPENID_REQUEST_PROFILE_SCOPE === 'false' ? false : true,
    forwardOIDCParams: process.env.OPENID_REQUEST_FORWARD_PARAMS === 'true' ? true : false,
    subjectPrefix: process.env.OPENID_SUBJECT_PREFIX === 'true' ? true : false,
  },
  certs: { publicKey: process.env.PUBLIC_KEY || '', privateKey: process.env.PRIVATE_KEY || '' },
  boxyhqLicenseKey: process.env.BOXYHQ_LICENSE_KEY,
  retraced,
  noAnalytics:
    process.env.DO_NOT_TRACK === '1' ||
    process.env.DO_NOT_TRACK === 'true' ||
    process.env.BOXYHQ_NO_ANALYTICS === '1' ||
    process.env.BOXYHQ_NO_ANALYTICS === 'true',
  terminus,
  webhook: { endpoint: process.env.WEBHOOK_URL || '', secret: process.env.WEBHOOK_SECRET || '' },
  dsync: {
    webhookBatchSize: process.env.DSYNC_WEBHOOK_BATCH_SIZE
      ? Number(process.env.DSYNC_WEBHOOK_BATCH_SIZE)
      : undefined,
    webhookBatchCronInterval: process.env.DSYNC_WEBHOOK_BATCH_CRON_INTERVAL
      ? Number(process.env.DSYNC_WEBHOOK_BATCH_CRON_INTERVAL)
      : undefined,
    debugWebhooks: process.env.DSYNC_DEBUG_WEBHOOKS === 'true',
    providers: {
      google: {
        clientId: process.env.DSYNC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.DSYNC_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
        authorizePath: googleDSyncAuthorizePath,
        callbackPath: googleDSyncCallbackPath,
        cronInterval: process.env.DSYNC_GOOGLE_CRON_INTERVAL
          ? Number(process.env.DSYNC_GOOGLE_CRON_INTERVAL)
          : undefined,
      },
    },
  },
  setupLinkExpiryDays,
  boxyhqHosted,
  ory: { projectId: process.env.ENTERPRISE_ORY_PROJECT_ID, sdkToken: process.env.ENTERPRISE_ORY_SDK_TOKEN },
  ssoTraces,
};

const adminPortalSSODefaults = {
  tenant: process.env.ADMIN_PORTAL_SSO_TENANT || '_jackson_boxyhq',
  product: process.env.ADMIN_PORTAL_SSO_PRODUCT || '_jackson_admin_portal',
  redirectUrl: [externalUrl],
  defaultRedirectUrl: `${externalUrl}/admin/auth/idp-login`,
};

const loggerOptions = { file: process.env.LOG_FILE, level: process.env.LOG_LEVEL };

export { adminPortalSSODefaults };
export { retraced as retracedOptions };
export { terminus as terminusOptions };
export { apiKeys };
export { jacksonOptions };
export { loggerOptions };
