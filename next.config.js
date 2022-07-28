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
    config.optimization.minimizer = [];
    config.module.rules.push({
      test: /\.js$/,
      use: ['source-map-loader'],
      enforce: 'pre',
    });
    config.devtool = 'eval-source-map';
    return config;
  },
  options: {
    sourcemaps: 'development',
  },
};
