export type SecurityLogsConfigCreate = {
  tenant: string;
  name?: string;
  config: any;
  type: string;
};

export type SecurityLogsConfig = {
  id: string;
  name?: string;
  tenant: string;
  config: any;
  type: string;
};
