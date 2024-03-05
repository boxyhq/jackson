import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { oidcMetadataParse, strategyChecker } from '@lib/utils';
import type { SetupLink } from '@boxyhq/saml-jackson';

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

  const _connections = connections.map((connection) => {
    return {
      clientID: connection.clientID,
      name: connection.name,
      deactivated: connection.deactivated,
      ...('oidcProvider' in connection
        ? {
            oidcProvider: {
              provider: connection.oidcProvider.provider,
              friendlyProviderName: connection.oidcProvider.friendlyProviderName,
            },
          }
        : undefined),
      ...('idpMetadata' in connection
        ? {
            idpMetadata: {
              provider: connection.idpMetadata.provider,
              friendlyProviderName: connection.idpMetadata.friendlyProviderName,
            },
          }
        : undefined),
    };
  });

  return res.json(_connections);
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { connectionAPIController } = await jackson();

  const body = {
    ...req.body,
    ...setupLink,
  };

  const { isSAML, isOIDC } = strategyChecker(req);

  if (isSAML) {
    await connectionAPIController.createSAMLConnection(body);
    res.status(201).json({ data: null });
  } else if (isOIDC) {
    await connectionAPIController.createOIDCConnection(oidcMetadataParse(body));
    res.status(201).json({ data: null });
  }

  throw { message: 'Missing SSO connection params', statusCode: 400 };
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

  // TODO:
  // Don't pass entire body to update functions

  if (isSAML) {
    await connectionAPIController.updateSAMLConnection(body);
    res.json({ data: null });
  } else if (isOIDC) {
    await connectionAPIController.updateOIDCConnection(oidcMetadataParse(body));
    res.json({ data: null });
  }

  throw { message: 'Missing SSO connection params', statusCode: 400 };
};

export default handler;
