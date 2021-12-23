export const indexNames = {
  entityID: 'entityID',
  tenantProduct: 'tenantProduct',
}

export const extractAuthToken = (req) => {
  const authHeader = req.get('authorization');
  const parts = (authHeader || '').split(' ');
  if (parts.length > 1) {
    return parts[1];
  }

  return null;
}