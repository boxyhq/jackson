import { Request } from 'express';

export const extractAuthToken = (req: Request): string | null => {
  const authHeader = req.get('authorization');
  const parts = (authHeader || '').split(' ');

  if (parts.length > 1) {
    return parts[1];
  }

  return null;
}

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct'
}