import { Storable } from '@boxyhq/saml-jackson';
import DB from 'npm/src/db/db';
import { jacksonOptions } from './env';
import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from 'next-auth/adapters';
import defaultDb from 'npm/src/db/defaultDb';
import { logger } from './logger';
import { randomUUID } from 'crypto';

const g = global as any;

export async function initNextAuthDB(): Promise<{
  userStore: Storable;
  accountStore: Storable;
  sessionStore: Storable;
  verificationTokenStore: Storable;
}> {
  if (!g.adminAuthStores) {
    const _opts = defaultDb(jacksonOptions);
    const db = await DB.new({ db: _opts.db, logger });

    g.adminAuthStores = {
      userStore: db.store('admin:auth:users'),
      accountStore: db.store('admin:auth:accounts'),
      sessionStore: db.store('admin:auth:sessions'),
      verificationTokenStore: db.store('admin:auth:verification-tokens'),
    };
  }

  return g.adminAuthStores;
}

/** @return { import("next-auth/adapters").Adapter } */
export default function DatabaseAdapter(): Adapter {
  const stores = (async () => await initNextAuthDB())();

  return {
    async createUser(user) {
      const id = randomUUID();
      const newUser = {
        ...user,
        id,
        emailVerified: user.emailVerified || null,
      };

      const { userStore } = await stores;
      await userStore.put(id, newUser);

      return newUser as AdapterUser;
    },

    async getUser(id) {
      if (!id) return null;

      const { userStore } = await stores;
      try {
        const user = await userStore.get(id);
        return (user as AdapterUser) || null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async getUserByEmail(email) {
      if (!email) return null;

      const { userStore } = await stores;

      // Since we don't have a direct email index, we need to scan
      // In a production environment, you'd want to use a proper database with indexes
      try {
        const allUsers = await userStore.list();
        const user = allUsers.find((u: AdapterUser) => u.email === email);
        return user || null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { accountStore, userStore } = await stores;

      try {
        // Find account with matching provider and providerAccountId
        const allAccounts = await accountStore.list();
        const account = allAccounts.find(
          (a: AdapterAccount) => a.provider === provider && a.providerAccountId === providerAccountId
        );

        if (!account) return null;

        // Get the user linked to this account
        return (await userStore.get(account.userId)) as AdapterUser;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async updateUser(user: AdapterUser) {
      if (!user.id) return null;

      const { userStore } = await stores;
      const existingUser = await userStore.get(user.id);

      if (!existingUser) return null;

      const updatedUser = { ...existingUser, ...user };
      await userStore.put(user.id, updatedUser);

      return updatedUser as AdapterUser;
    },

    async deleteUser(userId) {
      if (!userId) return;

      const { userStore, accountStore, sessionStore } = await stores;

      // Delete associated accounts and sessions
      const allAccounts = await accountStore.list();
      const userAccounts = allAccounts.filter((a: AdapterAccount) => a.userId === userId);

      for (const account of userAccounts) {
        await accountStore.delete(`${account.provider}:${account.providerAccountId}`);
      }

      const allSessions = await sessionStore.list();
      const userSessions = allSessions.filter((s: AdapterSession) => s.userId === userId);

      for (const session of userSessions) {
        await sessionStore.delete(session.sessionToken);
      }

      // Delete the user
      await userStore.delete(userId);
    },

    async linkAccount(account) {
      const { accountStore } = await stores;

      // Create a composite key for the account
      const accountKey = `${account.provider}:${account.providerAccountId}`;
      await accountStore.put(accountKey, account);

      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      const { accountStore } = await stores;
      const accountKey = `${provider}:${providerAccountId}`;

      try {
        const account = await accountStore.get(accountKey);
        if (account) {
          await accountStore.delete(accountKey);
        }
      } catch (error) {
        console.error(error);
      }
    },

    async createSession(session) {
      const { sessionStore } = await stores;
      await sessionStore.put(session.sessionToken, session);

      return session as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      if (!sessionToken) return null;

      const { sessionStore, userStore } = await stores;

      try {
        const session = (await sessionStore.get(sessionToken)) as AdapterSession;

        if (!session) return null;
        if (session.expires && new Date(session.expires) < new Date()) {
          // Session has expired
          await sessionStore.delete(sessionToken);
          return null;
        }

        const user = (await userStore.get(session.userId)) as AdapterUser;

        if (!user) return null;

        return { session, user };
      } catch (error) {
        console.error(error);
      }
    },

    async updateSession(session) {
      if (!session.sessionToken) return null;

      const { sessionStore } = await stores;

      try {
        const existingSession = await sessionStore.get(session.sessionToken);

        if (!existingSession) return null;

        const updatedSession = { ...existingSession, ...session };
        await sessionStore.put(session.sessionToken, updatedSession);

        return updatedSession as AdapterSession;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async deleteSession(sessionToken) {
      if (!sessionToken) return;

      const { sessionStore } = await stores;
      await sessionStore.delete(sessionToken);
    },

    async createVerificationToken(verificationToken) {
      const { verificationTokenStore } = await stores;

      // Use a composite key of identifier and token
      const tokenKey = `${verificationToken.identifier}:${verificationToken.token}`;
      await verificationTokenStore.put(tokenKey, verificationToken);

      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const { verificationTokenStore } = await stores;
      const tokenKey = `${identifier}:${token}`;

      try {
        const verificationToken = (await verificationTokenStore.get(tokenKey)) as VerificationToken;

        if (!verificationToken) return null;

        // Delete the token so it can't be used again
        await verificationTokenStore.delete(tokenKey);

        // Check if token has expired
        if (verificationToken.expires && new Date(verificationToken.expires) < new Date()) {
          return null;
        }

        return verificationToken;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  };
}
