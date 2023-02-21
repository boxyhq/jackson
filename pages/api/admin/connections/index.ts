import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { strategyChecker } from '@lib/utils';
import { adminPortalSSODefaults } from '@lib/env';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'POST':
      return handlePOST(req, res);
    case 'PATCH':
      return handlePATCH(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get all connections
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController, connectionAPIController } = await jackson();

  const { pageOffset, pageLimit, isSystemSSO } = req.query as {
    pageOffset: string;
    pageLimit: string;
    isSystemSSO?: string; // if present will be '' else undefined
  };

  const { tenant: adminPortalSSOTenant, product: adminPortalSSOProduct } = adminPortalSSODefaults;

  const connections =
    isSystemSSO === undefined
      ? (await adminController.getAllConnection(+(pageOffset || 0), +(pageLimit || 0)))?.map((conn) => ({
          ...conn,
          isSystemSSO: adminPortalSSOTenant === conn.tenant && adminPortalSSOProduct === conn.product,
        }))
      : await connectionAPIController.getConnections({
          tenant: adminPortalSSOTenant,
          product: adminPortalSSOProduct,
        });

  return res.json({ data: connections });
};

// Create a new connection
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    return res.status(400).json({ error: { message: 'Missing SSO connection params' } });
  }

  try {
    // Create SAML connection
    if (isSAML) {
      const connection = await connectionAPIController.createSAMLConnection(req.body);

      return res.status(201).json({ data: connection });
    }

    // Create OIDC connection
    if (isOIDC) {
      const connection = await connectionAPIController.createOIDCConnection(req.body);

      return res.status(201).json({ data: connection });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Update a connection
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    return res.status(400).json({ error: { message: 'Missing SSO connection params' } });
  }

  try {
    // Update SAML connection
    if (isSAML) {
      const connection = await connectionAPIController.updateSAMLConnection(req.body);

      return res.status(200).json({ data: connection });
    }

    // Update OIDC connection
    if (isOIDC) {
      const connection = await connectionAPIController.updateOIDCConnection(req.body);

      return res.status(200).json({ data: connection });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Delete a connection
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const { clientID, clientSecret } = req.body as {
    clientID: string;
    clientSecret: string;
  };

  try {
    await connectionAPIController.deleteConnections({ clientID, clientSecret });

    return res.status(200).json({ data: null });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

export default handler;
