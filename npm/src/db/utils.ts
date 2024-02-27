import Ripemd160 from 'ripemd160';
import { Index } from '../typings';

export const key = (namespace: string, k: string): string => {
  return namespace + ':' + k;
};

export const keyForIndex = (namespace: string, idx: Index): string => {
  return key(key(namespace, idx.name), idx.value);
};

export const keyDigest = (k: string): string => {
  return new Ripemd160().update(k).digest('hex');
};

export const keyFromParts = (...parts: string[]): string => {
  return parts.join(':');
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export function isNumeric(num) {
  return !isNaN(num);
}
export const normalizeOffsetAndLimit = ({
  pageLimit,
  pageOffset,
  maxLimit,
}: {
  pageOffset?: number;
  pageLimit?: number;
  maxLimit: number;
}) => {
  const skipOffset = pageOffset === undefined || !isNumeric(pageOffset);
  // options.pageLimit capped to 50 by default unless set from env
  const capToMaxLimit = pageLimit === undefined || !isNumeric(pageLimit) || pageLimit > maxLimit;
  return { skipOffset, capToMaxLimit };
};
export const indexPrefix = '_index';
export const createdAtPrefix = '_createdAt';
export const modifiedAtPrefix = '_modifiedAt';
