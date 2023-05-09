import jackson from '@lib/jackson';
import { oidcMetadataParse, strategyChecker } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GetConnectionsQuery } from '@boxyhq/saml-jackson';
import { sendAudit } from '@ee/audit-log/lib/retraced';
import { extractAuthToken, redactApiKey } from '@lib/auth';

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

  const connections = await connectionAPIController.getConnections(req.query as GetConnectionsQuery);

  return res.json(connections);
};

// Create a new connection
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }

  const connection = isSAML
    ? await connectionAPIController.createSAMLConnection(req.body)
    : await connectionAPIController.createOIDCConnection(oidcMetadataParse(req.body));

  sendAudit({
    action: 'sso.connection.create',
    crud: 'c',
    actor: {
      id: redactApiKey(extractAuthToken(req)),
      name: 'API key',
    },
  });

  return res.json(connection);
};

// Update a connection
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    throw { message: 'Missing SSO connection params', statusCode: 400 };
  }

  const connection = isSAML
    ? await connectionAPIController.updateSAMLConnection(req.body)
    : await connectionAPIController.updateOIDCConnection(oidcMetadataParse(req.body));

  sendAudit({
    action: 'sso.connection.update',
    crud: 'u',
    actor: {
      id: redactApiKey(extractAuthToken(req)),
      name: 'API key',
    },
  });

  return res.status(204).json(connection);
};

// Delete a connection
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  await connectionAPIController.deleteConnections(req.body);

  sendAudit({
    action: 'sso.connection.delete',
    crud: 'd',
    actor: {
      id: redactApiKey(extractAuthToken(req)),
      name: 'API key',
    },
  });

  return res.status(204).end();
};
