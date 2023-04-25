import type { NextApiRequest } from 'next';
import type { CRUD, Target } from '@retracedhq/retraced';

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

export type Request = {
  action: AuditEventType;
  req: NextApiRequest;
  crud: CRUD;
  target?: Target;
  source_ip?: string;
};

export type AuditEventType =
  | 'connection.sso.create'
  | 'connection.sso.update'
  | 'connection.sso.delete'
  | 'connection.sso.read'
  | 'connection.dsync.create'
  | 'connection.dsync.update'
  | 'connection.dsync.delete'
  | 'connection.dsync.read';
