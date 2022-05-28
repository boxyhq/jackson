import { UsersController } from './users';

export class SCIMUsers {
  private tenant;
  private product;
  private _store;
  private users;

  constructor({ db }) {
    this.users = new UsersController({ db });
  }

  public with(tenant, product) {
    this.product = product;
    this.tenant = tenant;

    return this;
  }

  // public async store() {
  //   this._store = this._store || this.db.store(`users:${tenant}:${product}`);
  // }

  public parse(id, method, body) {
    // Get the scim config
    // Validate the secret token
    // Call the right method
    // Parse the body
  }

  public async create(body: any) {
    const user = await this.users.with(this.tenant, this.product).create({
      first_name: body.name.givenName,
      last_name: body.name.familyName,
      email: body.emails[0].value,
      raw: body,
    });

    console.log(user);

    return user.raw;
  }

  public async update() {
    //
  }

  public async delete() {
    //
  }
}
