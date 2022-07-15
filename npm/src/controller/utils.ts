import type { OAuthErrorHandlerParams } from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
}

export const relayStatePrefix = 'boxyhq_jackson_';

export const validateAbsoluteUrl = (url, message) => {
  try {
    new URL(url);
  } catch (err) {
    throw new JacksonError(message ? message : 'Invalid url', 400);
  }
};

export const OAuthErrorResponse = ({
  error,
  error_description,
  redirect_uri,
  state,
}: OAuthErrorHandlerParams) => {
  return redirect.success(redirect_uri, { error, error_description, state });
};

// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
