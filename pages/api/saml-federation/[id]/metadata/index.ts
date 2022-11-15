import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Display the metadata for the SAML federation
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  const { id } = req.query as { id: string };

  const { data: metadata, error } = await samlFederation.app.getMetadata(id);

  if (error) {
    return res.status(error.code).send(error);
  }

  res.setHeader('Content-type', 'text/xml');
  res.status(200).send(metadata?.xml);
};
