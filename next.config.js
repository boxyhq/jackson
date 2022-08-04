/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      // Module not found
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /(^aws4$|^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^snappy$|^react-native-sqlite-storage$|^bson-ext$|^cardinal$|^kerberos$|^hdb-pool$|^mssql$|^sql.js$|^sqlite3$|^better-sqlite3$|^ioredis$|^typeorm-aurora-data-api-driver$|^pg-query-stream$|^oracledb$|^mysql$|^snappy\/package\.json$)/,
        })
      );
    }

    return config;
  },
  rewrites: async () => {
    return [
      {
        source: '/.well-known/openid-configuration',
        destination: '/api/well-known/openid-configuration',
      },
      {
        source: '/oauth/jwks',
        destination: '/api/oauth/jwks',
      },
    ];
  },
};
