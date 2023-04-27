import type { NextApiRequest } from 'next';
import type { Actor, CRUD, Target } from '@retracedhq/retraced';

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
  crud: CRUD;
  req?: NextApiRequest;
  actor?: Actor;
  target?: Target;
  source_ip?: string;
};

export type AuditEventType =
  // Single Sign On
  | 'sso.connection.create'
  | 'sso.connection.update'
  | 'sso.connection.delete'
  | 'sso.connection.view'
  | 'sso.setuplink.create'
  | 'sso.setuplink.delete'
  | 'sso.setuplink.view'

  // Directory Sync
  | 'dsync.connection.create'
  | 'dsync.connection.update'
  | 'dsync.connection.delete'
  | 'dsync.connection.view'
  | 'dsync.setuplink.create'
  | 'dsync.setuplink.delete'
  | 'dsync.setuplink.view'
  | 'dsync.user.view'
  | 'dsync.group.view'
  | 'dsync.event.view'

  // Federated SAML
  | 'federation.app.create'
  | 'federation.app.update'
  | 'federation.app.delete'
  | 'federation.app.view'

  // SAML Tracer
  | 'saml.tracer.view'

  // Retraced
  | 'retraced.project.create'
  | 'retraced.project.view'

  // Admin
  | 'admin.branding.update'
  | 'admin.auth.login';
