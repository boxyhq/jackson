export type AdminToken = {
  id: string;
  token: string;
  userId: string;
  disabled: boolean;
};

export type APIKey = {
  name: string;
  created: string;
  disabled: boolean;
  environment_id: string;
  project_id: string;
  token: string;
};

export type Environment = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  created: string;
  environments: Environment[];
  tokens: APIKey[];
  url?: string;
};

export type Group = {
  group_id: string;
  name: string;
};
