import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Display the metadata for the SAML federation
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { download } = req.query as { download: any };

  try {
    const metadata = await samlFederatedController.app.getMetadata();

    res.setHeader('Content-type', 'text/xml');

    if (download || download === '') {
      res.setHeader('Content-Disposition', `attachment; filename=saml-metadata.xml`);

      await pipeline(metadata.xml, res);
      return;
    }

    res.status(200).send(metadata.xml);
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};
