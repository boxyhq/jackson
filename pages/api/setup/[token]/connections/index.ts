import type { NextApiRequest, NextApiResponse } from 'next';
import jackson, { GetConnectionsQuery } from '@lib/jackson';
import { strategyChecker } from '@lib/utils';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const { setupLinkController } = await jackson();
  const token = req.query.token;
  const { data: setup, error: err } = await setupLinkController.getByToken(token);
  if (err || !setup) {
    res.status(err ? err.code : 401).json({ err });
  } else {
    switch (method) {
      case 'GET':
        return handleGET(res, setup);
      case 'POST':
        return handlePOST(req, res, setup);
      case 'PATCH':
        return handlePATCH(req, res, setup);
      case 'DELETE':
        return handleDELETE(req, res, setup);
      default:
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
        res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
    }
  }
};

const handleGET = async (res: NextApiResponse, setup: any) => {
  const { connectionAPIController } = await jackson();
  return res.json({
    data: await connectionAPIController.getConnections({
      tenant: setup.tenant,
      product: setup.product,
    } as GetConnectionsQuery),
  });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse, setup: any) => {
  const { connectionAPIController } = await jackson();
  const body = {
    ...req.body,
    tenant: setup?.tenant,
    product: setup?.product,
  };
  const { isSAML, isOIDC } = strategyChecker(req);
  if (isSAML) {
    return res.status(201).json({ data: await connectionAPIController.createSAMLConnection(body) });
  } else if (isOIDC) {
    return res.status(201).json({ data: await connectionAPIController.createOIDCConnection(body) });
  } else {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse, setup: any) => {
  const { connectionAPIController } = await jackson();
  const body = {
    ...req.body,
    tenant: setup?.tenant,
    product: setup?.product,
  };
  await await connectionAPIController.deleteConnections(body);
  res.status(200).json({ data: null });
};

const handlePATCH = async (req: NextApiRequest, res: NextApiResponse, setup: any) => {
  const { connectionAPIController } = await jackson();
  const body = {
    ...req.body,
    tenant: setup?.tenant,
    product: setup?.product,
  };
  const { isSAML, isOIDC } = strategyChecker(req);
  if (isSAML) {
    res.status(200).json({ data: await connectionAPIController.updateSAMLConnection(body) });
  } else if (isOIDC) {
    res.status(200).json({ data: await connectionAPIController.updateOIDCConnection(body) });
  } else {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }
};

export default handler;
