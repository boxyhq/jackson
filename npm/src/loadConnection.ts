import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import {
  OIDCSSOConnection,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
} from './typings';

const loadConnection = async (
  preLoadedConnection: string
): Promise<
  (SAMLSSOConnectionWithEncodedMetadata | SAMLSSOConnectionWithRawMetadata | OIDCSSOConnection)[]
> => {
  if (preLoadedConnection.startsWith('./')) {
    preLoadedConnection = path.resolve(process.cwd(), preLoadedConnection);
  }

  preLoadedConnection = path.resolve(preLoadedConnection);

  const files = await fs.promises.readdir(preLoadedConnection);
  const connections: (
    | SAMLSSOConnectionWithEncodedMetadata
    | SAMLSSOConnectionWithRawMetadata
    | OIDCSSOConnection
  )[] = [];

  for (const idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const fileUrl = url.pathToFileURL(path.join(preLoadedConnection, file)).toString();
      const {
        default: connection,
      }: {
        default: SAMLSSOConnectionWithEncodedMetadata | SAMLSSOConnectionWithRawMetadata | OIDCSSOConnection;
      } = await import(/* webpackIgnore: true */ fileUrl);
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
