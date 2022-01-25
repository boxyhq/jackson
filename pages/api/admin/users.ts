import * as micromatch from 'micromatch';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: Date;
};

const emailVerified = new Date();
export class UserProvider {
  async getUserByEmail(email: string): Promise<User | null> {
    const acl = process.env.NEXTAUTH_ACL?.split(',');

    if (acl) {
      if (micromatch.isMatch(email, acl)) {
        return {
          id: email,
          name: email.split('@')[0],
          email,
          role: 'admin',
          emailVerified,
        };
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.getUserByEmail(id);
  }

  async isAllowedToSignIn(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);

    if (!user) {
      return false;
    }

    return true;
  }
}
