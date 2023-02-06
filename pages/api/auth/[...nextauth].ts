import Adapter from '@lib/nextAuthAdapter';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
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
          name: email.split('@')[0].toUpperCase(),
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

      // Bypass ACL for credentials and boxyhq-saml
      if (account?.provider === 'credentials' || account?.provider === 'boxyhq-saml') {
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
