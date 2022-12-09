import { Storable } from '@boxyhq/saml-jackson';
import DB from 'npm/src/db/db';
import opts from './env';
import type { AdapterUser, VerificationToken } from 'next-auth/adapters';
import { validateEmailWithACL } from './utils';
import defaultDb from 'npm/src/db/defaultDb';

const g = global as any;

export async function initNextAuthDB(): Promise<Storable> {
  if (!g.adminAuthStore) {
    const _opts = defaultDb(opts);
    const db = await DB.new(_opts.db);
    g.adminAuthStore = db.store('admin:auth');
  }
  return g.adminAuthStore as Storable;
}

/** @return { import("next-auth/adapters").Adapter } */
export default function Adapter() {
  const store = (async () => await initNextAuthDB())();
  return {
    async createUser(user) {
      return user;
    },
    async getUser(id) {
      return;
    },
    async getUserByEmail(email) {
      return email
        ? ({
            id: email,
            name: email.split('@')[0],
            email,
            role: 'admin',
            emailVerified: new Date(),
          } as AdapterUser)
        : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      return;
    },
    async updateUser(user: AdapterUser) {
      if (!user.id) {
        return null;
      }
      return user;
    },
    // will be required in a future release, but are not yet invoked
    async deleteUser(userId) {
      return;
    },
    async linkAccount(account) {
      return;
    },
    // will be required in a future release, but are not yet invoked
    async unlinkAccount({ providerAccountId, provider }) {
      return;
    },
    async createSession({ sessionToken, userId, expires }) {
      return;
    },
    async getSessionAndUser(sessionToken) {
      return;
    },
    async updateSession({ sessionToken }) {
      return;
    },
    async deleteSession(sessionToken) {
      return;
    },
    async createVerificationToken(data: VerificationToken) {
      await (await store).put(data.identifier, data);
    },
    async useVerificationToken({ identifier, token }) {
      const tokenInStore = await (await store).get(identifier);
      if (tokenInStore.token === token) {
        await (await store).delete(identifier);
      }
      return tokenInStore ?? null;
    },
  };
}
