import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import retraced from '@ee/retraced';
import { adminPortalSSODefaults, boxyhqHosted } from '@lib/env';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'POST, GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Create new Security Logs Config
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { securityLogsConfigController } = await jackson();

  const { tenant, type, config } = req.body as {
    tenant: string;
    type: string;
    config: any;
  };

  const id = await securityLogsConfigController.createSecurityLogsConfig({
    tenant: boxyhqHosted ? tenant : adminPortalSSODefaults.tenant,
    type,
    config,
  });

  retraced.reportAdminPortalEvent({
    action: 'security.logs.config.create',
    crud: 'c',
    req,
    target: {
      id,
    },
  });

  return res.status(201).json({ data: id });
};

// Get Security Logs Configs
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { securityLogsConfigController } = await jackson();

  const { offset, limit, pageToken, tenant } = req.query as {
    offset: string;
    limit: string;
    pageToken?: string;
    tenant: string;
  };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const configs = await securityLogsConfigController.getAll(
    boxyhqHosted ? tenant : adminPortalSSODefaults.tenant,
    pageOffset,
    pageLimit,
    pageToken
  );
  if (configs.pageToken) {
    res.setHeader('jackson-pagetoken', configs.pageToken);
  }

  return res.json({ data: configs.data });
};

export default handler;
