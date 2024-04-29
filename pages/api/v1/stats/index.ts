import { defaultHandler } from '@lib/api';
import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController, directorySyncController, samlFederatedController } = await jackson();

  const sso_connections_count = await connectionAPIController.getCount();
  const dsync_connections_count = await directorySyncController.directories.getCount();
  const idfed_apps_count = samlFederatedController.app.getCount();

  return res.json({
    data: {
      sso_connections: sso_connections_count,
      dsync_connections: dsync_connections_count,
      idfed_apps: idfed_apps_count,
    },
  });
};
