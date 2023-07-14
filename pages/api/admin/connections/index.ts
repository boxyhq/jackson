import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { oidcMetadataParse, strategyChecker } from '@lib/utils';
import { adminPortalSSODefaults } from '@lib/env';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

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
};

// Get all connections
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController, connectionAPIController } = await jackson();

  const { pageOffset, pageLimit, isSystemSSO, pageToken } = req.query as {
    pageOffset: string;
    pageLimit: string;
    isSystemSSO?: string; // if present will be '' else undefined
    pageToken?: string;
  };

  const { tenant: adminPortalSSOTenant, product: adminPortalSSOProduct } = adminPortalSSODefaults;

  const paginatedConnectionList = await adminController.getAllConnection(
    +(pageOffset || 0),
    +(pageLimit || 0),
    pageToken
  );

  const connections =
    isSystemSSO === undefined
      ? // For the Connections list under Enterprise SSO, `isSystemSSO` flag added to show system sso badge
        paginatedConnectionList?.data?.map((conn) => ({
          ...conn,
          isSystemSSO: adminPortalSSOTenant === conn.tenant && adminPortalSSOProduct === conn.product,
        }))
      : // For settings view, pagination not done for now as the system connections are expected to be a few
        await connectionAPIController.getConnections({
          tenant: adminPortalSSOTenant,
          product: adminPortalSSOProduct,
        });

  if (paginatedConnectionList.pageToken) {
    res.setHeader('jackson-pagetoken', paginatedConnectionList.pageToken);
  }
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
      const connection = await connectionAPIController.createOIDCConnection(oidcMetadataParse(req.body));

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
      const connection = await connectionAPIController.updateOIDCConnection(oidcMetadataParse(req.body));

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

  const { clientID, clientSecret } = req.query as {
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
