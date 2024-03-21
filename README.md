# SAML Jackson: Open Source Enterprise SSO And Directory Sync

<a href="https://bestpractices.coreinfrastructure.org/projects/7493"><img src="https://bestpractices.coreinfrastructure.org/projects/7493/badge" alt="OpenSSF Best Practices Badge"></a>
<a href="https://www.npmjs.com/package/@boxyhq/saml-jackson"><img src="https://img.shields.io/npm/dt/@boxyhq/saml-jackson" alt="NPM downloads badge" ></a>
<a href="https://hub.docker.com/r/boxyhq/jackson"><img src="https://img.shields.io/docker/pulls/boxyhq/jackson" alt="Docker pull statistics badge"></a>
<a href="https://github.com/boxyhq/jackson/blob/main/LICENSE"><img src="https://img.shields.io/github/license/boxyhq/jackson" alt="Apache 2.0 license badge"></a>
<a href="https://github.com/boxyhq/jackson/issues"><img src="https://img.shields.io/github/issues/boxyhq/jackson" alt="Open Github issues badge"></a>
<a href="https://github.com/boxyhq/jackson/stargazers"><img src="https://img.shields.io/github/stars/boxyhq/jackson" alt="Github stargazers"></a>
<a href="https://www.npmjs.com/package/@boxyhq/saml-jackson"><img src="https://img.shields.io/node/v/@boxyhq/saml-jackson" alt="Nodejs version support badge"></a>
<a href="https://raw.githubusercontent.com/boxyhq/jackson/main/swagger/swagger.json"><img src="https://img.shields.io/swagger/valid/3.0?specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Fboxyhq%2Fjackson%2Fmain%2Fswagger%2Fswagger.json" alt="Swagger Validator badge"></a>

SAML Jackson bridges or proxies a SAML login flow to OAuth 2.0 or OpenID Connect, abstracting away all the complexities of the SAML protocol. It also supports Directory Sync via the SCIM 2.0 protocol for automatic user and group provisioning/de-provisioning.

> We now also support OpenID Connect providers.

![A quick demo of the admin portal without sound to show an overview of what to expect. It shows features such as SSO, the ability to set up SSO connections, Setup Links, Directory sync, and more](samljackson480.gif)

## Directory Sync

SAML Jackson also supports Directory Sync based on the SCIM 2.0 protocol.

Directory sync helps organizations automate the provisioning and de-provisioning of their users. As a result, it streamlines the user lifecycle management process by saving valuable organizational hours, creating a single truth source of the user identity data, and facilitating them to keep the data secure.

For complete documentation, visit [boxyhq.com/docs/directory-sync/overview](https://boxyhq.com/docs/directory-sync/overview)

## 🌟 Why star this repository?

If you find this project helpful, please consider supporting us by starring [the repository](https://github.com/boxyhq/jackson) and sharing it with others. This helps others find the project, grow the community and ensure the long-term health of the project. 🙏

- [SAML Jackson: Open Source Enterprise SSO And Directory Sync](#saml-jackson-open-source-enterprise-sso-and-directory-sync)
  - [Directory Sync](#directory-sync)
  - [🌟 Why star this repository?](#-why-star-this-repository)
  - [🚀 Getting Started with SAML Jackson](#-getting-started-with-saml-jackson)
    - [Try A Demo](#try-a-demo)
    - [Deploying SAML Jackson as a separate service locally](#deploying-saml-jackson-as-a-separate-service-locally)
      - [Prerequisites](#prerequisites)
      - [Clone the repository](#clone-the-repository)
      - [Install dependencies](#install-dependencies)
      - [Setup environment variables](#setup-environment-variables)
      - [Database](#database)
      - [Start the development server](#start-the-development-server)
    - [Documentation](#documentation)
    - [Easy Cloud Deployment](#easy-cloud-deployment)
  - [Videos](#videos)
  - [End-to-End (E2E) tests](#end-to-end-e2e-tests)
  - [About BoxyHQ](#about-boxyhq)
  - [Security And Observability](#security-and-observability)
    - [Observability](#observability)
    - [SBOM Reports (Software Bill Of Materials)](#sbom-reports-software-bill-of-materials)
    - [Container Signing and Verification](#container-signing-and-verification)
    - [🛡️ Reporting Security Issues](#️-reporting-security-issues)
  - [Contributing](#contributing)
  - [💫 Support](#-support)
  - [📌 License](#-license)

## 🚀 Getting Started with SAML Jackson

There are two ways to integrate SAML Jackson into an application. Depending on your use case, you can choose either of them. <br>

1. [As a separate service](https://boxyhq.com/docs/jackson/deploy/service) ([Next.js](https://nextjs.org/) application) This includes an admin portal out of the box for managing SSO and Directory Sync connections.
2. [NPM library](https://boxyhq.com/docs/jackson/deploy/npm-library) as an embedded library in your application.

### Try A Demo

- Try our hosted demo showcasing the SAML service provider (SP) initiated [login flow here](https://saml-demo.boxyhq.com), which uses our [Mock SAML](https://mocksaml.com) IdP service.
- Try an Identity Provider (IdP) initiated [login flow here](https://mocksaml.com/saml/login).

### Deploying SAML Jackson as a separate service locally

Let's get you to Hello SAML Jackson in no time.

#### Prerequisites

- [Node.js](https://nodejs.org/en) at version `18.14.2` or higher

> It is generally a good idea to install and maintain Node.js versions using a version manager like [nvm](https://github.com/nvm-sh/nvm) or [nvs](https://github.com/jasongin/nvs) on Windows. More [information is available here](https://schalkneethling.com/posts/installing-node-and-managing-versions).

#### Clone the repository

```bash
git clone https://github.com/boxyhq/jackson.git
cd jackson
```

#### Install dependencies

```bash
npm i
```

#### Setup environment variables

Create a `.env` from the existing `.env.example` file in the root of the project.

```bash
cp .env.example .env
```

> **Environment variable documentation:** Have a look at https://boxyhq.com/docs/jackson/deploy/env-variables for all of the available environment variables.

#### Database

For the rest of the setup, we will use a PostgreSQL database. The easiest way to get PostgreSQL up and running on macOS is by using Postgres.app. You can download it from [https://postgresapp.com/](https://postgresapp.com/).

> For other operating systems and alternative options for MacOS, please see the [documentation available on the Prisma website](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database).

#### Start the development server

Now that we have our database running we can start the development server. But before we do, we need a way to log into the admin portal.

To log in to the admin portal we either need to [configure magic links](https://boxyhq.com/docs/admin-portal/overview#1-magic-links), or [enable username and password](https://boxyhq.com/docs/admin-portal/overview#2-email-and-password) login. The easiest one, and the one we will use, is to enable username and password login.

In your `.env` find the `NEXTAUTH_ADMIN_CREDENTIALS` environment variable. We need to provide an `email:password` combination that we can then use to log in to the admin portal. For example:

```bash
NEXTAUTH_ADMIN_CREDENTIALS=admin@example.com:password
```

Now we can start the development server:

```bash
npm run dev
```

Open `http://localhost:5225` in your browser and you should be redirected to the login screen.

At the login screen, you can now use the username and password you set in the `NEXTAUTH_ADMIN_CREDENTIALS` environment variable to log in. Click "Sign In" and you should be logged in and see the SSO Connections page with no configured connections. We have reached Hello SAML Jackson!

### Documentation

For the full documentation, visit [boxyhq.com/docs/jackson/overview](https://boxyhq.com/docs/jackson/overview)

### Easy Cloud Deployment

Deploy SAML Jackson to the cloud with a single click using the following providers:

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fboxyhq%2Fjackson&env=DB_ENGINE,DB_TYPE,DB_URL,DB_ENCRYPTION_KEY,DB_TTL,DB_CLEANUP_LIMIT,JACKSON_API_KEYS,EXTERNAL_URL,IDP_ENABLED,SAML_AUDIENCE,CLIENT_SECRET_VERIFIER,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_FROM,NEXTAUTH_URL,NEXTAUTH_SECRET,NEXTAUTH_ACL&envDescription=DB%20configuration%20and%20keys%20for%20encryption%20and%20authentication.EXTERNAL_URL%20(Usually%20https%3A%2F%2F%3Cproject-name-from-above%3E.vercel.app)%20can%20be%20set%20after%20deployment%20from%20the%20project%20dashboard.Set%20to%20''%20if%20not%20applicable.&envLink=https://boxyhq.com/docs/jackson/deploy/env-variables>)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Videos

- SSO/OIDC Tutorial [SAML Jackson Enterprise SSO](https://www.youtube.com/watch?v=nvsD4-GQw4A) (split into chapters to easily find what you are looking for)
- SAML single sign-on login [demo](https://www.youtube.com/watch?v=VBUznQwoEWU)

## End-to-End (E2E) tests

Create a `.env.test.local` file and populate the values. To execute the tests run:

```zsh
npm run test:e2e
```

## About BoxyHQ

<a href="https://boxyhq.com/enterprise-sso">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/boxyhq/.github/assets/66887028/df1c9904-df2f-4515-b403-58b14a0e9093">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/boxyhq/.github/assets/66887028/e093a466-72ea-41c6-a292-4c39a150facd">
  <img alt="BoxyHQ - Security building blocks for developers" src="https://github.com/boxyhq/jackson/assets/66887028/b40520b7-dbce-400b-88d3-400d1c215ea1" height="auto" width="400" />
</picture>
</a>

BoxyHQ is on a mission to democratize enterprise readiness for developers one building block at a time. We are building a suite of security building blocks that are easy to use and integrate into your applications. Our goal is to make being enterprise-ready accessible to all developers, founders, and those responsible for the security of their internal applications regardless of their security expertise.

<a href="https://twitter.com/BoxyHQ"><img src="https://img.shields.io/twitter/follow/boxyhq?style=social" alt="Follow us on Twitter/X"></a>
<a href="https://www.linkedin.com/company/boxyhq"><img src="https://img.shields.io/badge/LinkedIn-blue" alt="Connect with us on LinkedIn"></a>

Community is core to our mission. We are building a community of developers, security enthusiasts, and founders who are passionate about security and building secure applications. We are building in the open and would love for you to join us on this journey.

Join the community on Discord today.

<a href="https://discord.gg/uyb7pYt4Pa"><img src="https://img.shields.io/discord/877585485235630130" alt="Join the community on Discord"></a>

## Security And Observability

### Observability

We support first-class observability on the back of OpenTelemetry, refer [here](https://boxyhq.com/docs/jackson/observability) for more details.

### SBOM Reports (Software Bill Of Materials)

We support SBOM reports, refer [here](https://boxyhq.com/docs/jackson/sbom) for more details.

### Container Signing and Verification

We support container image verification using cosign, refer [here](https://boxyhq.com/docs/jackson/container-signing) for more details.

### 🛡️ Reporting Security Issues

[Responsible Disclosure](SECURITY.md)

## Contributing

Thank you for your interest in contributing to SAML Jackson! We are excited to welcome contributions from the community. Please refer to our [contributing guidelines](CONTRIBUTING.md) for more information.

## 💫 Support

Reach out to the maintainers at one of the following places:

- [GitHub Discussions](https://github.com/boxyhq/jackson/discussions)
- [GitHub Issues](https://github.com/boxyhq/jackson/issues)
- [Discord](https://discord.gg/uyb7pYt4Pa)

## 📌 License

[Apache 2.0 License](https://github.com/boxyhq/jackson/blob/main/LICENSE)
