import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import { strings } from '@lib/strings';
import { sendAudit } from '@lib/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return res.status(404).json({
      error: {
        message: strings['enterprise_license_not_found'],
      },
    });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    case 'PUT':
      return await handlePUT(req, res);
    case 'DELETE':
      return await handleDELETE(req, res);
    default:
      res.setHeader('Allow', 'GET, PUT, DELETE');
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get SAML Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  try {
    const app = await samlFederatedController.app.get(id);
    const metadata = await samlFederatedController.app.getMetadata();

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
  const { name, acsUrl, entityId, logoUrl, faviconUrl, primaryColor } = req.body as Pick<
    SAMLFederationApp,
    'acsUrl' | 'entityId' | 'name' | 'logoUrl' | 'faviconUrl' | 'primaryColor'
  >;

  try {
    const updatedApp = await samlFederatedController.app.update(id, {
      name,
      acsUrl,
      entityId,
      logoUrl,
      faviconUrl,
      primaryColor,
    });

    await sendAudit({
      action: 'federation.saml.update',
      crud: 'u',
      req,
    });

    return res.status(200).json({ data: updatedApp });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
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

    await sendAudit({
      action: 'federation.saml.delete',
      crud: 'd',
      req,
    });

    return res.status(200).json({ data: {} });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

export default handler;
