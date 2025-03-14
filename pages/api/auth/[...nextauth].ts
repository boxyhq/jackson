import type { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next';
import NextAuth, { Account, NextAuthOptions, User } from 'next-auth';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import type { Provider } from 'next-auth/providers';
import { setCookie } from 'cookies-next';
import { randomUUID } from 'crypto';
import { encode as defaultEncode } from 'next-auth/jwt';
import crypto from 'crypto';
import DatabaseAdapter from '@lib/nextAuthAdapter';
import { isAuthProviderEnabled, verifyPassword } from '@lib/auth';
import jackson from '@lib/jackson';
import env from '@lib/env';
import { sessionName } from '@lib/constants';
import { validateEmailWithACL } from '@lib/utils';

const adapter = DatabaseAdapter();
const providers: Provider[] = [];
const sessionMaxAge = 14 * 24 * 60 * 60; // 14 days
const useSecureCookie = env.appUrl.startsWith('https://');

export const sessionTokenCookieName = (useSecureCookie ? '__Secure-' : '') + 'next-auth.session-token';

// Build provider list based on enabled auth methods
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
          if (adapter.getUserByEmail) {
            const user = await adapter.getUserByEmail(email as string);
            if (!user) {
              throw Error('Invalid credentials');
            }

            const hasValidPassword = await verifyPassword(password, user?.password as string);

            if (!hasValidPassword) {
              throw new Error('Invalid credentials');
            }
          } else {
            throw Error(
              'No admin credentials found. Please set NEXTAUTH_ADMIN_CREDENTIALS in your environment variables'
            );
          }
        }

        // Find the admin credentials that match the email and password
        const adminCredentialsMatch = adminCredentials?.split(',').find((credential) => {
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
      name: 'SAML IdP Login',
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

// Helper function to create a database session
async function createDatabaseSession(
  user: User,
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

// Helper function to link an account to a user
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

// Determine which session strategy to use
const determineSessionStrategy = () => {
  if (isAuthProviderEnabled('credentials') || isAuthProviderEnabled('idp-initiated')) {
    return 'jwt';
  }
  return 'database';
};

// Get NextAuth options
const getAuthOptions = (
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
): NextAuthOptions => {
  // Determine the appropriate session strategy
  const sessionStrategy = determineSessionStrategy();
  console.log(sessionStrategy);

  return {
    theme: {
      colorScheme: 'light',
    },
    providers,
    session: {
      strategy: 'database',
      maxAge: 30 * 24 * 60 * 60,
    },
    jwt: {
      maxAge: 60 * 60 * 24 * 30,
      encode: async function (params) {
        if (params.token?.credentials) {
          const sessionToken = randomUUID();

          if (!params.token.sub) {
            throw new Error('No user ID found in token');
          }

          const createdSession = await adapter?.createSession?.({
            sessionToken: sessionToken,
            userId: params.token.sub,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });

          if (!createdSession) {
            throw new Error('Failed to create session');
          }

          return sessionToken;
        }
        return defaultEncode(params);
      },
    },
    cookies: {
      sessionToken: {
        name: sessionName,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: !(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'),
        },
      },
    },
    callbacks: {
      async signIn({ user, account }): Promise<boolean> {
        console.log('In SignIn');
        if (!user.email) {
          return false;
        }

        // Bypass ACL for credentials and boxyhq-saml (including IdP login)
        if (
          account?.provider === 'credentials' ||
          account?.provider === 'boxyhq-saml' ||
          account?.provider === 'boxyhq-saml-idplogin'
        ) {
          return true;
        }

        // For database strategy
        if (sessionStrategy === 'database' && adapter.getUserByEmail) {
          const existingUser = await adapter.getUserByEmail(user.email);
          const isIdpLogin = account?.provider === 'boxyhq-idp';

          if (!isIdpLogin) {
            await createDatabaseSession(user, req, res);
          }

          // First time users
          if (!existingUser) {
            const newUser = await adapter.createUser({
              name: user.name,
              email: user.email,
            });

            await linkAccount(newUser, account as Account);
            await createDatabaseSession(newUser, req, res);
            return true;
          }

          await createDatabaseSession(existingUser, req, res);
        }

        return validateEmailWithACL(user.email);
      },

      async session({ session, token, user }) {
        console.log('in session: ', session);
        if (session?.user) {
          if (sessionStrategy === 'jwt' && token) {
            session.user.id = token.sub as string;
          } else if (user) {
            session.user.id = user.id;
          }
        }
        return session;
      },

      async jwt({ token, user, account }) {
        if (account?.provider === 'credentials') {
          token.credentials = true;
        }
        console.log('in jwt: ', token);

        if (user) {
          token.sub = user.id;
        }
        return token;
      },
    },
    pages: {
      signIn: '/admin/auth/login',
    },
    ...(sessionStrategy === 'database' ? { adapter } : {}),
  };
};

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, getAuthOptions(req, res));
}
