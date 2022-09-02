import * as fs from 'fs';
import * as path from 'path';
import { IdPConnection } from './typings';

const loadConnection = async (preLoadedConnection: string): Promise<IdPConnection[]> => {
  if (preLoadedConnection.startsWith('./')) {
    preLoadedConnection = path.resolve(process.cwd(), preLoadedConnection);
  }

  const files = await fs.promises.readdir(preLoadedConnection);
  const connections: IdPConnection[] = [];

  for (const idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const { default: connection }: { default: IdPConnection } = await import(
        /* webpackIgnore: true */ path.join(preLoadedConnection, file)
      );
      if (!connection.oidcDiscoveryUrl) {
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
