const map = {
  'test/api.test.ts': ['src/controller/api.ts'],
  'test/oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*'],
  'test/db.test.ts': ['src/db/*'],
};

module.exports = (testFile) => {
  return map[testFile];
};
