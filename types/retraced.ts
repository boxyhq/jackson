import type { NextApiRequest } from 'next';
import type { Target } from '@retracedhq/retraced';

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
  crud: 'c' | 'r' | 'u' | 'd';
  target?: Target;
};

export type AuditEventType =
  | 'connection.sso.created'
  | 'connection.sso.updated'
  | 'connection.sso.deleted'
  | 'connection.dsync.created'
  | 'connection.dsync.updated'
  | 'connection.dsync.deleted';
