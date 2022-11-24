import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'PUT':
      return handlePUT(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get SAML Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederated } = await jackson();

  const { id } = req.query as { id: string };

  try {
    const app = await samlFederated.app.get(id);
    const metadata = await samlFederated.app.getMetadata(id);

    return res.status(200).json({
      data: {
        ...app,
        metadata,
      },
    });
  } catch (error: any) {
    const { message, statusCode } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Update SAML Federation app
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederated } = await jackson();

  const { id } = req.query as { id: string };
  const { name, acsUrl, entityId } = req.body as Pick<SAMLFederationApp, 'acsUrl' | 'entityId' | 'name'>;

  try {
    const updatedApp = await samlFederated.app.update(id, {
      name,
      acsUrl,
      entityId,
    });

    res.status(200).json({
      data: updatedApp,
    });
  } catch (error: any) {
    const { message, statusCode } = error;

    res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);
