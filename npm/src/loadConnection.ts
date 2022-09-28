import * as fs from 'fs';
import * as path from 'path';
import {
  OIDCIdPConnection,
  SAMLIdPConnectionWithEncodedMetadata,
  SAMLIdPConnectionWithRawMetadata,
} from './typings';

const loadConnection = async (
  preLoadedConnection: string
): Promise<
  (SAMLIdPConnectionWithEncodedMetadata | SAMLIdPConnectionWithRawMetadata | OIDCIdPConnection)[]
> => {
  if (preLoadedConnection.startsWith('./')) {
    preLoadedConnection = path.resolve(process.cwd(), preLoadedConnection);
  }

  const files = await fs.promises.readdir(preLoadedConnection);
  const connections: (
    | SAMLIdPConnectionWithEncodedMetadata
    | SAMLIdPConnectionWithRawMetadata
    | OIDCIdPConnection
  )[] = [];

  for (const idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const {
        default: connection,
      }: {
        default: SAMLIdPConnectionWithEncodedMetadata | SAMLIdPConnectionWithRawMetadata | OIDCIdPConnection;
      } = await import(/* webpackIgnore: true */ path.join(preLoadedConnection, file));
      if (!('oidcDiscoveryUrl' in connection)) {
        const rawMetadata = await fs.promises.readFile(
          path.join(preLoadedConnection, path.parse(file).name + '.xml'),
          'utf8'
        );
        connection.encodedRawMetadata = Buffer.from(rawMetadata, 'utf8').toString('base64');
      }

      connections.push(connection);
    }
  }

  return connections;
};

export default loadConnection;
