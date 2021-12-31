// module.exports = (test) => test.replace(/\.test\.ts$/, '.ts');

const map = {
  'api.test.ts': ['src/controller/api.ts'],
  'oauth.test.ts': ['src/controller/oauth.ts', 'src/controller/oauth/*'],
  'db.test.ts': ['src/db/*'],
};

module.exports = (testFile) => {
  return map[testFile.split('/')[2]];
};
