import { apiKeys } from '@lib/env';

export const validateApiKey = (token: string | null) => {
  if (!token) {
    return false;
  }

  return apiKeys.includes(token);
};

export const extractAuthToken = (req): string | null => {
  let authHeader = '';

  if (typeof req.headers.get === 'function') {
    authHeader = req.headers.get('authorization') || '';
  } else {
    authHeader = req.headers.authorization || '';
  }

  const parts = authHeader.split(' ');

  return parts.length > 1 ? parts[1] : null;
};

export const redactApiKey = (apiKey: string | null) => {
  if (!apiKey) {
    throw new Error('API key must be provided');
  }

  const redactedLength = 4;
  const apiKeyLength = apiKey.length;
  const redactedPart = '*'.repeat(redactedLength);

  return apiKey.substring(0, apiKeyLength - 4) + redactedPart;
};
