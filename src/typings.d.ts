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

interface ISAMLConfig {
  // Ensure backward compatibility
  config(body: IdPConfig): Promise<Client>
  getConfig(body: IABC): Promise<Partial<Client>>
  deleteConfig(body: IABC): Promise<void>

  create(body: IdPConfig): Promise<Client>
  get(body: IABC): Promise<Partial<Client>>
  delete(body: IABC): Promise<void>
}

interface Index {
  name: string,
  value: string
}