import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { sendAudit } from '@ee/audit-log/lib/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      case 'GET':
        return await handleGET(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', 'POST, GET, DELETE');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Create a new setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { tenant, product, service, regenerate, name, description, defaultRedirectUrl, redirectUrl } =
    req.body;

  const setupLink = await setupLinkController.create({
    tenant,
    product,
    service,
    name,
    description,
    defaultRedirectUrl,
    redirectUrl,
    regenerate,
  });

  sendAudit({
    action: service === 'dsync' ? 'dsync.setuplink.create' : 'sso.setuplink.create',
    crud: 'c',
    req,
  });

  return res.status(201).json({ data: setupLink });
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { setupID } = req.query as { setupID: string };

  const setupLink = await setupLinkController.getById(setupID);

  await setupLinkController.remove(setupID);

  sendAudit({
    action: setupLink.service === 'dsync' ? 'dsync.setuplink.delete' : 'sso.setuplink.delete',
    crud: 'c',
    req,
  });

  return res.json({ data: {} });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { offset, limit, pageToken, token, service } = req.query as {
    offset: string;
    limit: string;
    pageToken?: string;
    token: string;
    service: string;
  };

  if (!token && !service) {
    return res.status(404).json({
      error: {
        message: 'Setup link is invalid',
        code: 404,
      },
    });
  }

  // Get a setup link by token
  if (token) {
    const setupLink = await setupLinkController.getByToken(token);

    sendAudit({
      action: setupLink.service === 'dsync' ? 'dsync.setuplink.view' : 'sso.setuplink.view',
      crud: 'r',
      req,
    });

    return res.json({ data: setupLink });
  }

  // Get a setup link by service
  if (service) {
    const setupLinksPaginated = await setupLinkController.getByService(
      service,
      +(offset || 0),
      +(limit || 0),
      pageToken
    );

    if (setupLinksPaginated.pageToken) {
      res.setHeader('jackson-pagetoken', setupLinksPaginated.pageToken);
    }

    sendAudit({
      action: service === 'dsync' ? 'dsync.setuplink.view' : 'sso.setuplink.view',
      crud: 'r',
      req,
    });

    return res.json({ data: setupLinksPaginated.data });
  }
};

export default handler;
