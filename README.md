# SAML Jackson (not fiction anymore)

SAML service [SAML in a box from BoxyHQ]

You need someone like Jules Winnfield to save you from the vagaries of SAML login.

## Source code visualizer
[CodeSee codebase visualizer](https://app.codesee.io/maps/public/53e91640-23b5-11ec-a724-79d7dd589517)

# Deployment
The docker container can be found at https://hub.docker.com/r/boxyhq/jackson/tags. It is preferable to use a specific version instead of the `latest` tag. Jackson uses two ports (configurable if needed, see below) 5000 and 6000. 6000 is the internal port and ideally should not be exposed to a public network.

Example of a docker run:
```
docker run -p 5000:5000 -p 6000:6000 boxyhq/jackson:7ce6cc6f
```

# Database Support
Jackson currently supports SQL databases (Postgres, CockroachDB, MySQL and MariaDB), MongoDB and Redis.

# Configuration
Configuration is done via env vars. The following options are supported and will have to be configured during deployment:
- HOST_URL: The URL to bind to, defaults to `localhost`
- HOST_PORT: The port to bind to, defaults to `5000`
- EXTERNAL_URL: The public URL to reach this service, used internally for documenting the SAML configuration instructions. Defaults to `http://{HOST_URL}:{HOST_PORT}`
- INTERNAL_HOST_URL: The URL to bind to expose the internal APIs, defaults to `localhost`. Do not configure this to a public network
- INTERNAL_HOST_PORT: The port to bind to for the internal APIs, defaults to `6000`
- SAML_AUDIENCE: This is just an identitifer to validate the SAML audience, this value will also get configured in the SAML apps created by your customers. Once set do not change this value unless you get your customers to reconfigure their SAML again. Defaults to `https://saml.boxyhq.com` and is case sensitive. This does not have be a real URL
- IDP_ENABLED: Set to `true` to enable IdP initiated login for SAML. SP initiated login is the only recommended flow but you might have to support IdP login at times. Defaults to `false`
- DB_ENGINE: Supported values are `redis`, `sql`, `mongo`, `mem`. Defaults to `sql`
- DB_URL: The database URL to connect to, for example `postgres://postgres:postgres@localhost:5450/jackson`
- DB_TYPE: Only needed when DB_ENGINE is `sql`. Supported values are `postgres`, `cockroachdb`, `mysql`, `mariadb`. Defaults to `postgres`

- PRELOADED_CONFIG: If you only need a single tenant or a handful of pre-configured tenants then this config will help you red and load SAMl configs. It works well with the mem db engine so you don't have to configure any external databases for this to work (though it works with those as well). This is a path (absolute or relative) to a direct that contains files organized in the format described in the next section.

# Pre-loaded SAML Configuration
If PRELOADED_CONFIG is set then it should point to a directory with the following structure (example below):-
```
boxyhq.js
boxyhq.xml
anothertenant.js
anothertenant.xml
```
The JS file has the following structure:-
```
module.exports = {
  defaultRedirectUrl: 'http://localhost:3000/login/saml',
  redirectUrl: '["http://localhost:3000/*", "http://localhost:5000/*"]',
  tenant: 'boxyhq.com',
  product: 'demo',
};
```
The XML file (should share the name with the .js file) is the raw XML metadata file you receive from your Identity Provider. Please ensure it is saved in the `utf-8` encoding.

The config and XML above correspond to the `SAML API config` (see below).

# SAML Login flows
There are two kinds of SAML login flows - SP-initiated and IdP-initiated. We highly recommend sticking to the SP-initiated flow since it is more secure but Jackson also support the IdP-initiated flow if you enable it. For in-depth understand of SAML and the two flows please refer to Okta's comprehensive guide - https://developer.okta.com/docs/concepts/saml/.

# Setting up SAML with your customer's Identity Provider
Please follow the instructions here to guide your customer's in setting up SAML correctly for your product(s). You should create a copy of the doc and modify it with your custom settings, we have used the values that work for our demo apps - https://docs.google.com/document/d/1fk---Z9Ln59u-2toGKUkyO3BF6Dh3dscT2u4J2xHANE.

# SAML config API
Once your customer has setup the SAML app on their Identity Provider, they Identity Provider will generate an IdP or SP metadata file. Some Identity Providers only generate an IdP metadata file but it usually works for the SP login flow as well. It is an XML file that contains various attributes Jackson needs in order to validate incoming SAML login requests. This step is the equivalent of setting an OAuth 2.0 app and generating a client ID and client Secret that will be used in the login flow.

You will need to provide a place in the UI for your customers (The account settings page is usually a good place for this) to configure this and then call the API below.

The following API call sets up the configuration in Jackson:
```
curl --location --request POST 'http://localhost:6000/api/v1/saml/config' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'rawMetadata=<IdP/SP metadata XML>' \
--data-urlencode 'defaultRedirectUrl=http://localhost:3000/login/saml' \
--data-urlencode 'redirectUrl=["http://localhost:3000/*", "http://localhost:5000/*"]' \
--data-urlencode 'tenant=boxyhq.com' \
--data-urlencode 'product=demo'
```

- rawMetadata: The XML metadata file your customer gets from their Identity Provider.
- defaultRedirectUrl: The redirect URL to use in the IdP login flow. Jackson will call this URL after completing an IdP login flow.
- redirectUrl: JSON encoded array containing a list of allowed redicrect URLs. Jackson will disallow any redirects not on this list (or not the default URL above).
- tenant: Jackson supports a multi-tenant architecture, this is a unique identifier you set from your side that relates back to your customer's tenant. This is normally an email, domain, an account id or user id.
- product: Jackson support multiple products, this is a uniqie identifier you set from your side that relates back to the product your customer is using.

The response returns a json with `client_id` and `client_secret` that can be stored against your tenant and product for a more secure OAuth 2.0 flow.

# OAuth 2.0 Flow
Jackson has been designed to abstract the SAML login flow as a pure OAuth 2.0 flow. This means it's compatible with any standard OAuth 2.0 library out there, both client side and server side. It is important to remember that SAML is configured per customer unlike OAuth 2.0 where you can have a single OAuth app supporting logins for all customers.

Jackson also supports the PKCE authorization flow (https://oauth.net/2/pkce/), so you can protect your SPAs.
