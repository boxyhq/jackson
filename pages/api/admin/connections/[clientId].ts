import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import retraced from '@ee/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get connection by clientID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { clientId } = req.query as {
    clientId: string;
  };

  try {
    const connections = await connectionAPIController.getConnections({ clientID: clientId });

    retraced.reportAdminPortalEvent({
      action: 'sso.connection.get',
      crud: 'r',
      req,
      target: {
        id: clientId,
      },
    });

    return res.json({ data: connections[0] });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

export default handler;
