import Adapter from '@lib/nextAuthAdapter';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';
import { validateEmailWithACL } from '@lib/utils';
import env from '@lib/env';

export default NextAuth({
  theme: {
    colorScheme: 'light',
  },
  providers: [
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } },
      issuer: env.externalUrl,
      clientId: `tenant=${process.env.NEXT_PUBLIC_ADMIN_PORTAL_TENANT}&product=${process.env.NEXT_PUBLIC_ADMIN_PORTAL_PRODUCT}`,
      clientSecret: 'dummy',
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
      name: `next-auth.saml-jackson`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async signIn({ user }): Promise<boolean> {
      if (!user.email) {
        return false;
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
