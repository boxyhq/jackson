const map = {
  'test/api.test.ts': ['src/controller/api.ts'],
  'test/oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*', 'src/controller/utils.ts'],
  'test/signout.test.ts': ['src/controller/signout.ts', 'src/controller/utils.ts'],
  'test/db.test.ts': ['src/db/*'],
};

module.exports = (testFile) => {
  return map[testFile];
};
