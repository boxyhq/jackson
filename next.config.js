/** @type {import('next').NextConfig} */
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
  reactStrictMode: true,
  swcMinify: false,
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      // Module not found
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /(^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^snappy$|^react-native-sqlite-storage$|^bson-ext$|^cardinal$|^kerberos$|^hdb-pool$|^mssql$|^sql.js$|^sqlite3$|^better-sqlite3$|^ioredis$|^typeorm-aurora-data-api-driver$|^pg-query-stream$|^oracledb$|^mysql$|^snappy\/package\.json$)/,
        })
      );

      config.plugins.push(
        new FilterWarningsPlugin({
          exclude: [/Critical dependency: the request of a dependency is an expression/],
        })
      );

      // // Critical dependency: the request of a dependency is an expression
      // config.plugins.push(new webpack.ContextReplacementPlugin(/app-root-path/));
    }

    return config;
  },
};
