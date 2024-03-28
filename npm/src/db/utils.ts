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
function isNumeric(num) {
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
  // maxLimit capped to 50 by default unless set from env (db.options.pageLimit)
  const capToMaxLimit =
    pageLimit === undefined || pageLimit === 0 || !isNumeric(pageLimit) || pageLimit > maxLimit;

  return { offset: skipOffset ? 0 : pageOffset, limit: capToMaxLimit ? maxLimit : pageLimit };
};
export const indexPrefix = '_index';
export const createdAtPrefix = '_createdAt';
export const modifiedAtPrefix = '_modifiedAt';
