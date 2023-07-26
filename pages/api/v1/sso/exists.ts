import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GetConnectionsQuery } from '@boxyhq/saml-jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

// Check if a connection exists
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const connections = await connectionAPIController.getConnections(req.query as GetConnectionsQuery);

  if (connections.length === 0) {
    return res.status(404).send({});
  } else {
    res.status(204).end();
    return;
  }
};
