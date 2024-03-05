import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
  });
};

// Get connection by clientID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { clientId } = req.query as {
    clientId: string;
  };

  const connections = await connectionAPIController.getConnections({ clientID: clientId });

  res.json({ data: connections[0] });
};

export default handler;
