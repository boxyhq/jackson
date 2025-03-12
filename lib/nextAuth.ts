import type { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next';
import { Account, NextAuthOptions, User } from 'next-auth';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import type { Provider } from 'next-auth/providers';
import { setCookie } from 'cookies-next';
import { randomUUID } from 'crypto';
import DatabaseAdapter from './nextAuthAdapter';
import env from './env';
import { isAuthProviderEnabled } from './auth';
import crypto from 'crypto';
// import { AdapterUser } from 'next-auth/adapters';
import jackson from './jackson';

const adapter = DatabaseAdapter();
const providers: Provider[] = [];
const sessionMaxAge = 14 * 24 * 60 * 60; // 14 days
const useSecureCookie = env.appUrl.startsWith('https://');

export const sessionTokenCookieName = (useSecureCookie ? '__Secure-' : '') + 'next-auth.session-token';

if (isAuthProviderEnabled('credentials')) {
  providers.push(
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const { email, password } = credentials;

        if (!email || !password) {
          return null;
        }

        const adminCredentials = process.env.NEXTAUTH_ADMIN_CREDENTIALS;

        if (!adminCredentials) {
          throw Error(
            'No admin credentials found. Please set NEXTAUTH_ADMIN_CREDENTIALS in your environment variables'
          );
        }

        // Find the admin credentials that match the email and password
        const adminCredentialsMatch = adminCredentials.split(',').find((credential) => {
          const [adminEmail, adminPassword] = credential.split(':');
          try {
            return (
              crypto.timingSafeEqual(Buffer.from(adminEmail), Buffer.from(email)) &&
              crypto.timingSafeEqual(Buffer.from(adminPassword), Buffer.from(password))
            );
          } catch {
            return false;
          }
        });

        // No match found
        if (!adminCredentialsMatch) {
          throw Error('Invalid email or password provided.');
        }

        return {
          id: Buffer.from(email).toString('base64'),
          name: email.split('@')[0],
          email,
        };
      },
    })
  );
}

if (isAuthProviderEnabled('saml')) {
  providers.push(
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } },
      issuer: process.env.externalUrl,
      clientId: 'dummy',
      clientSecret: 'dummy',
      httpOptions: {
        timeout: 30000,
      },
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (isAuthProviderEnabled('idp-initiated')) {
  providers.push(
    CredentialsProvider({
      id: 'boxyhq-saml-idplogin',
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'SAML IdP Login',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        code: {},
      },
      async authorize(credentials) {
        const { code } = credentials || {};
        if (!code) {
          return null;
        }
        const { oauthController } = await jackson();

        // Fetch access token
        const { access_token } = await oauthController.token({
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.NEXTAUTH_URL || '',
          client_id: 'dummy',
          client_secret: process.env.CLIENT_SECRET_VERIFIER || '',
        });

        if (!access_token) {
          return null;
        }
        // Fetch user info
        const userInfo = await oauthController.userInfo(access_token);

        if (!userInfo) {
          return null;
        }

        if (userInfo?.id && userInfo?.email) {
          return {
            id: userInfo.id,
            email: userInfo.email,
            name: [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' '),
            image: null,
          };
        }
        return null;
      },
    })
  );
}

if (isAuthProviderEnabled('email')) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM,
    })
  );
}

async function createDatabaseSession(
  user,
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + sessionMaxAge * 1000);

  if (adapter.createSession) {
    await adapter.createSession({
      sessionToken,
      userId: user.id,
      expires,
    });
  }

  setCookie(sessionTokenCookieName, sessionToken, {
    req,
    res,
    expires,
    secure: useSecureCookie,
  });
}

export const getAuthOptions = (
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
) => {
  const isCredentialsProviderCallbackWithDbSession =
    (req as NextApiRequest).query?.nextauth?.includes('callback') &&
    ((req as NextApiRequest).query?.nextauth?.includes('credentials') ||
      (req as NextApiRequest).query?.nextauth?.includes('boxyhq-idp')) &&
    req.method === 'POST' &&
    env.nextAuth.sessionStrategy === 'database';

  const authOptions: NextAuthOptions = {
    adapter,
    providers,
    pages: {
      signIn: '/admin/auth/login',
    },
    session: {
      strategy: 'database', // Ensure this is set to 'database'
      maxAge: sessionMaxAge,
    },
    secret: env.nextAuth.secret,
    callbacks: {
      async signIn({ user, account }) {
        console.log('in signIn: ', user);
        if (!user || !user.email || !account) {
          return false;
        }

        if (adapter.getUserByEmail) {
          const existingUser = await adapter.getUserByEmail(user.email);
          const isIdpLogin = account.provider === 'boxyhq-idp';

          // Handle credentials provider
          if (isCredentialsProviderCallbackWithDbSession && !isIdpLogin) {
            await createDatabaseSession(user, req, res);
          }

          // First time users
          if (!existingUser) {
            const newUser = await adapter.createUser({
              name: user.name,
              email: user.email,
            });

            await linkAccount(newUser, account);

            if (isCredentialsProviderCallbackWithDbSession) {
              await createDatabaseSession(newUser, req, res);
            }

            return true;
          }

          // Existing users reach here
          if (isCredentialsProviderCallbackWithDbSession) {
            await createDatabaseSession(existingUser, req, res);
          }

          return true;
        } else {
          return false;
        }
      },

      async session({ session, token, user }) {
        console.log('in session: ', session);
        if (session && (token || user)) {
          session.user.id = token?.sub || user?.id;
        }

        return session;
      },

      async jwt({ token, session }) {
        console.log('in jwt: ', session);

        // Only handle JWT for specific triggers; otherwise return the token as is
        return token;
      },
    },
  };

  return authOptions;
};

const linkAccount = async (user: User, account: Account) => {
  if (adapter.linkAccount) {
    return await adapter.linkAccount({
      providerAccountId: account.providerAccountId,
      userId: user.id,
      provider: account.provider,
      type: 'oauth',
      scope: account.scope,
      token_type: account.token_type,
      access_token: account.access_token,
    });
  }
};
