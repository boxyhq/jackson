import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import retraced from '@ee/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
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
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Get Security Logs config by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { securityLogsConfigController } = await jackson();

  const { id } = req.query as { id: string };

  const config = await securityLogsConfigController.get(id);

  return res.status(200).json({
    data: {
      ...config,
    },
  });
};

// Update Security Logs config
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { securityLogsConfigController } = await jackson();

  const { id } = req.query as { id: string };

  const { config } = req.body as { config: any };

  const updatedApp = await securityLogsConfigController.update(id, config);

  retraced.reportAdminPortalEvent({
    action: 'security.logs.config.update',
    crud: 'u',
    req,
    target: {
      id: updatedApp.id,
    },
  });

  return res.status(200).json({ data: updatedApp });
};

// Delete the Security Logs config
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { securityLogsConfigController } = await jackson();

  const { id } = req.query as { id: string };

  await securityLogsConfigController.delete(id);

  retraced.reportAdminPortalEvent({
    action: 'security.logs.config.delete',
    crud: 'd',
    req,
    target: {
      id,
    },
  });

  return res.status(200).json({ data: {} });
};

export default handler;
