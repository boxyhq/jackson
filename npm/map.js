const map = {
  'test/api.test.ts': ['src/controller/api.ts', 'src/controller/connection/*'],
  'test/oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*', 'src/controller/utils.ts'],
  'test/logout.test.ts': ['src/controller/logout.ts', 'src/controller/utils.ts'],
  'test/db.test.ts': ['src/db/*'],
};

module.exports = (testFile) => {
  return map[testFile];
};
