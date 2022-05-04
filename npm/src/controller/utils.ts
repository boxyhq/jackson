import { JacksonError } from './error';
import { customAlphabet } from 'nanoid/async';

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

export const createRandomString = async (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const nanoid = customAlphabet(characters, length);

  return await nanoid();
};
