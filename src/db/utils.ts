import Ripemd160 from 'ripemd160';
import { Index } from '../typings';

export const key = (namespace: string, k: string): string => {
  return namespace + ':' + k;
};

export const keyForIndex = (namespace: string, idx: Index): string => {
  return key(key(namespace, idx.name), idx.value);
};

export const keyDigest = (k: string): Ripemd160 => {
  return new Ripemd160().update(k).digest('hex');
};

export const keyFromParts = (...parts: string[]): string => {
  // TODO: pick a better strategy, keys can collide now

  return parts.join(':');
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const indexPrefix = '_index';
