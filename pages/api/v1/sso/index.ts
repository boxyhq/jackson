import jackson from '@lib/jackson';
import { oidcMetadataParse, strategyChecker } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import type { DelConnectionsQuery } from '@boxyhq/saml-jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      case 'POST':
        return await handlePOST(req, res);
      case 'PATCH':
        return await handlePATCH(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

// Get all connections
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const params = req.query as any;

  if ('sort' in params) {
    params['sort'] = params.sort === 'true';
  }

  const connections = await connectionAPIController.getConnections(params);

  return res.json(connections);
};

// Create a new connection
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }

  // Create SAML connection
  if (isSAML) {
    const connection = await connectionAPIController.createSAMLConnection(req.body);

    return res.json(connection);
  }

  // Create OIDC connection
  if (isOIDC) {
    const connection = await connectionAPIController.createOIDCConnection(oidcMetadataParse(req.body));

    return res.json(connection);
  }
};

// Update a connection
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }

  // Update SAML connection
  if (isSAML) {
    await connectionAPIController.updateSAMLConnection(req.body);

    res.status(204).end();
  }

  // Update OIDC connection
  if (isOIDC) {
    await connectionAPIController.updateOIDCConnection(oidcMetadataParse(req.body) as any);

    res.status(204).end();
  }
};

// Delete a connection
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  await connectionAPIController.deleteConnections(req.query as DelConnectionsQuery);

  res.status(204).end();
};
