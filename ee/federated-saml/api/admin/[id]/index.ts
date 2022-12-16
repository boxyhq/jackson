import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return res.status(404).json({
      error: { message: 'License not found. Please add a valid license to use this feature.' },
    });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'PUT':
      return handlePUT(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET, PUT, DELETE']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get SAML Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  try {
    const app = await samlFederatedController.app.get(id);
    const metadata = await samlFederatedController.app.getMetadata(id);

    return res.status(200).json({
      data: {
        ...app,
        metadata,
      },
    });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Update SAML Federation app
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };
  const { name, acsUrl, entityId } = req.body as Pick<SAMLFederationApp, 'acsUrl' | 'entityId' | 'name'>;

  try {
    const updatedApp = await samlFederatedController.app.update(id, {
      name,
      acsUrl,
      entityId,
    });

    res.status(200).json({
      data: updatedApp,
    });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({
      error: { message },
    });
  }
};

// Delete the SAML Federation app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  try {
    await samlFederatedController.app.delete(id);

    return res.status(200).json({ data: {} });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);
