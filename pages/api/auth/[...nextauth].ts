import Adapter from '@lib/nextAuthAdapter';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';
import { validateEmailWithACL } from '@lib/utils';
import { jacksonOptions as env } from '@lib/env';
import { sessionName } from '@lib/constants';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  theme: {
    colorScheme: 'light',
  },
  providers: [
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } },
      issuer: env.externalUrl,
      clientId: 'dummy',
      clientSecret: 'dummy',
      httpOptions: {
        timeout: 30000,
      },
      allowDangerousEmailAccountLinking: true,
    }),
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
        const res = await fetch(`${env.externalUrl}/api/oauth/token`, {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: 'dummy',
            client_secret: process.env.CLIENT_SECRET_VERIFIER,
            redirect_url: process.env.NEXTAUTH_URL,
            code,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          return null;
        }
        const json = await res.json();
        if (!json?.access_token) {
          return null;
        }
        const resUserInfo = await fetch(`${env.externalUrl}/api/oauth/userinfo`, {
          headers: {
            Authorization: `Bearer ${json.access_token}`,
          },
        });
        if (!resUserInfo.ok) {
          return null;
        }
        const profile = await resUserInfo.json();
        if (profile?.id && profile?.email) {
          return {
            id: profile.id,
            email: profile.email,
            name: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
            image: null,
          };
        }
        return null;
      },
    }),
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
    }),
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

          return adminEmail === email && adminPassword === password;
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
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
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

      return validateEmailWithACL(user.email);
    },
  },
  pages: {
    signIn: '/admin/auth/login',
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  adapter: Adapter(),
});
