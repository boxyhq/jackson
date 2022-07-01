const map = {
  'test/saml/api.test.ts': ['src/controller/api.ts'],
  'test/saml/oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*', 'src/controller/utils.ts'],
  'test/saml/logout.test.ts': ['src/controller/logout.ts', 'src/controller/utils.ts'],
  'test/db/db.test.ts': ['src/db/*'],

  'test/dsync/directories.test.ts': ['src/directory-sync/DirectoryConfig.ts'],
  'test/dsync/users.test.ts': [
    'src/directory-sync/DirectoryUsers.ts',
    'src/directory-sync/Users.ts',
    'src/directory-sync/request.ts',
  ],
  'test/dsync/groups.test.ts': [
    'src/directory-sync/DirectoryGroups.ts',
    'src/directory-sync/Groups.ts',
    'src/directory-sync/request.ts',
  ],
  'test/dsync/events.test.ts': ['src/directory-sync/events.ts'],
};

module.exports = (testFile) => {
  return map[testFile];
};
