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
      for (let i = 0; i < acl?.length; i++) {
        if (email.endsWith(acl[i])) {
          return {
            id: email,
            name: email.replace(acl[i], ''),
            email,
            role: 'admin',
            emailVerified,
          };
        }
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
