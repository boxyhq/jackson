import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { oidcMetadataParse, strategyChecker } from '@lib/utils';
import type { SetupLink } from '@npm/src/index';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { method } = req;
  const { token } = req.query as { token: string };

  try {
    const setupLink = await setupLinkController.getByToken(token);

    switch (method) {
      case 'GET':
        return await handleGET(req, res, setupLink);
      case 'POST':
        return await handlePOST(req, res, setupLink);
      case 'PATCH':
        return await handlePATCH(req, res, setupLink);
      case 'DELETE':
        return await handleDELETE(req, res, setupLink);
      default:
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { connectionAPIController } = await jackson();

  const connections = await connectionAPIController.getConnections({
    tenant: setupLink.tenant,
    product: setupLink.product,
  });

  return res.json({ data: connections });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { connectionAPIController } = await jackson();

  const body = {
    ...req.body,
    ...setupLink,
  };

  const { isSAML, isOIDC } = strategyChecker(req);

  if (isSAML) {
    return res.status(201).json({ data: await connectionAPIController.createSAMLConnection(body) });
  } else if (isOIDC) {
    return res
      .status(201)
      .json({ data: await connectionAPIController.createOIDCConnection(oidcMetadataParse(body)) });
  } else {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { connectionAPIController } = await jackson();

  const body = {
    ...req.query,
    tenant: setupLink.tenant,
    product: setupLink.product,
  };

  await connectionAPIController.deleteConnections(body);

  return res.json({ data: null });
};

const handlePATCH = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { connectionAPIController } = await jackson();

  const body = {
    ...req.body,
    ...setupLink,
  };

  const { isSAML, isOIDC } = strategyChecker(req);

  if (isSAML) {
    res.json({ data: await connectionAPIController.updateSAMLConnection(body) });
  } else if (isOIDC) {
    res.json({ data: await connectionAPIController.updateOIDCConnection(oidcMetadataParse(body)) });
  } else {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }
};

export default handler;
