import NextAuth, { Awaitable } from 'next-auth';
import type { AdapterUser, VerificationToken } from 'next-auth/adapters';
import EmailProvider from 'next-auth/providers/email';
import { User, UserProvider } from '../admin/users';

const userProvider = new UserProvider();

const verificationToken = {
  identifier: 'kiran@boxyhq.com',
  expires: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
  token: 'verification-token',
};

const adapter = {
  async getUserByEmail(email: string): Promise<User | null> {
    return await userProvider.getUserByEmail(email);
  },

  // TODO: Why this method?
  async updateUser(user: Partial<AdapterUser>): Promise<AdapterUser> {
    return {
      id: '1',
      name: 'Kiran',
      email: 'kiran@boxyhq.com',
      emailVerified: new Date(),
    };
  },

  async createVerificationToken({
    identifier,
    expires,
    token,
  }): Promise<VerificationToken | null | undefined> {
    return verificationToken;
  },

  useVerificationToken({ identifier, token }): Awaitable<VerificationToken | null> {
    return verificationToken;
  },
};

const callbacks = {
  async signIn({ user }): Promise<boolean> {
    if (!user.email) {
      return false;
    }

    return await userProvider.isAllowedToSignIn(user.email);
  },
};

export default NextAuth({
  debug: true,
  providers: [
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
    secret: process.env.NEXTAUTH_JWT_SIGNING_PRIVATE_KEY,
    maxAge: 60 * 60 * 24 * 30,
  },
  // @ts-ignore
  adapter: adapter,
  callbacks: callbacks,
});
