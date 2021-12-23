export type IdPConfig = {
  defaultRedirectUrl: string;
  redirectUrl: string;
  tenant: string;
  product: string;
  rawMetadata: string
}

// TODO: Need a better interface name
export interface Client {
  client_id: string
  client_secret: string
  provider: string
}

// TODO: Suggest an interface name
export type IABC = {
  clientID: string
  clientSecret?: string
  tenant?: string
  product?: string
} | {
  clientID?: string
  clientSecret?: string
  tenant: string
  product: string
}

export interface ISAMLConfig {
  // Ensure backward compatibility
  config(body: IdPConfig): Promise<Client>
  getConfig(body: IABC): Promise<Partial<Client>>
  deleteConfig(body: IABC): Promise<void>

  create(body: IdPConfig): Promise<Client>
  get(body: IABC): Promise<Partial<Client>>
  delete(body: IABC): Promise<void>
}

export interface Index {
  name: string,
  value: string
}

export interface DatabaseDriver {
  get(key: string);
  put(key: string, value: any, indexes: Index[]);
  delete(key: string);
  getByIndex(idx: Index);
}

export interface StoreContract extends DatabaseDriver {
  namespace: string;
  db: DatabaseDriver;
  ttl: string;
}