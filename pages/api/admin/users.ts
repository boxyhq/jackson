export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: Date;
};

const users: User[] = [
  {
    id: '1',
    name: 'Deepak',
    email: 'deepak@boxyhq.com',
    role: 'owner',
    emailVerified: new Date(),
  },

  {
    id: '2',
    name: 'Aswin',
    email: 'aswin@boxyhq.com',
    role: 'admin',
    emailVerified: new Date(),
  },

  {
    id: '3',
    name: 'Kiran',
    email: 'kiran@boxyhq.com',
    role: 'staff',
    emailVerified: new Date(),
  },
];

export class UserProvider {
  private users: User[];

  constructor() {
    this.users = users;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.users.filter((user) => {
      return user.email === email;
    });

    if (users.length > 0) {
      return users[0];
    }

    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = this.users.filter((user) => {
      return user.id === id;
    });

    if (users.length > 0) {
      return users[0];
    }

    return null;
  }

  async isAllowedToSignIn(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);

    if (!user) {
      return false;
    }

    return true;
  }
}
