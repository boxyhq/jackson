import _ from 'lodash';
import crypto from 'crypto';

import type { User, Group } from '../../typings';
import { IDirectoryProvider } from './types';

interface SCIMUserSchema {
  userName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: [
    {
      primary: boolean;
      value: string;
      type: string;
    }
  ];
  userId: string;
  active: boolean;
  rawAttributes: any;
}

interface SCIMGroupSchema {
  displayName: string;
  groupId: string;
  rawAttributes: any;
}

export const toGroupSCIMPayload = (group: Group): SCIMGroupSchema => {
  return {
    displayName: group.name,
    groupId: group.id,
    rawAttributes: group.raw,
  };
};

export const toUserSCIMPayload = (user: User): SCIMUserSchema => {
  return {
    userName: user.email,
    name: {
      givenName: user.first_name,
      familyName: user.last_name,
    },
    emails: [
      {
        primary: true,
        value: user.email,
        type: 'work',
      },
    ],
    userId: user.id,
    active: user.active,
    rawAttributes: user.raw,
  };
};

export const isUserUpdated = (
  existingUser: User,
  userFromProvider: User,
  ignoreFields: string[] | undefined
) => {
  if (ignoreFields && ignoreFields.length > 0) {
    ignoreFields.forEach((field) => {
      _.unset(existingUser.raw, field);
      _.unset(userFromProvider.raw, field);
    });
  }

  return getObjectHash(existingUser.raw) !== getObjectHash(userFromProvider.raw);
};

export const isGroupUpdated = (
  existingGroup: Group,
  groupFromProvider: Group,
  ignoreFields: string[] | undefined
) => {
  if (ignoreFields && ignoreFields.length > 0) {
    ignoreFields.forEach((field) => {
      _.unset(existingGroup.raw, field);
      _.unset(groupFromProvider.raw, field);
    });
  }

  return getObjectHash(existingGroup.raw) !== getObjectHash(groupFromProvider.raw);
};

export const compareAndFindDeletedGroups = (existingGroups: Group[] | null, groups: Group[]) => {
  if (!existingGroups || existingGroups.length === 0) {
    return [];
  }

  const groupsToDelete = existingGroups.filter((existingGroup) => {
    return !groups.some((group) => group.id === existingGroup.id);
  });

  return groupsToDelete;
};

export const compareAndFindDeletedUsers = (existingUsers: User[] | null, users: User[]) => {
  if (!existingUsers || existingUsers.length === 0) {
    return [];
  }

  const usersToDelete = existingUsers.filter((existingUser) => {
    return !users.some((user) => user.id === existingUser.id);
  });

  return usersToDelete;
};

const normalizeObject = (obj: any) => {
  if (_.isArray(obj)) {
    return obj.map(normalizeObject);
  } else if (_.isObject(obj)) {
    const sortedKeys = _.sortBy(Object.keys(obj));
    return _.fromPairs(sortedKeys.map((key) => [key, normalizeObject(obj[key])]));
  } else {
    return obj;
  }
};

const getObjectHash = (obj: any) => {
  const normalizedObj = normalizeObject(obj);
  const hash = crypto.createHash('sha1');

  hash.update(JSON.stringify(normalizedObj));

  return hash.digest('hex');
};
