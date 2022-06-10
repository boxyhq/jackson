const map = {
  'test/saml/api.test.ts': ['src/controller/api.ts'],
  'test/saml/oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*', 'src/controller/utils.ts'],
  'test/saml/logout.test.ts': ['src/controller/logout.ts', 'src/controller/utils.ts'],
  'test/db/db.test.ts': ['src/db/*'],
  'test/dsync/directories.test.ts': ['src/directory-sync/directories.ts'],
  'test/dsync/users.test.ts': ['src/directory-sync/users.ts'],
};

module.exports = (testFile) => {
  return map[testFile];
};
