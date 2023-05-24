import _ from 'lodash';
import crypto from 'crypto';

import type { User, Group } from '../../typings';

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

export const isUserUpdated = (existingUser: User, userFromProvider: User) => {
  return getObjectHash(existingUser.raw) !== getObjectHash(userFromProvider.raw);
};

export const isGroupUpdated = (existingGroup: Group, groupFromProvider: Group) => {
  return getObjectHash(existingGroup.raw) !== getObjectHash(groupFromProvider.raw);
};

const compareAndFindDeletedGroups = (existingGroup: Group[], groupFromProvider: Group[]) => {
  const deletedGroups: Group[] = [];

  if (existingGroup.length === 0) {
    return deletedGroups;
  }

  const groupFromProviderIds = groupFromProvider.map((group) => group.id);

  for (const group of existingGroup) {
    if (!groupFromProviderIds.includes(group.id)) {
      deletedGroups.push(group);
    }
  }

  return deletedGroups;
};

const compareAndFindDeletedUsers = (existingUsers: User[], usersFromProvider: User[]) => {
  //
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
