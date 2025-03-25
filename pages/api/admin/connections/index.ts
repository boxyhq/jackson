import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { oidcMetadataParse, parsePaginateApiParams, strategyChecker } from '@lib/utils';
import { adminPortalSSODefaults, jacksonOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';
import { ApiError } from '@lib/error';
import { validateDevelopmentModeLimits } from '@lib/development-mode';
import defaultDb from 'npm/src/db/defaultDb';
import { logger } from '@lib/logger';
import DB from 'npm/src/db/db';
import { SAMLSSORecord } from 'npm/src';

interface ConnectionData {
  tenant: string;
  product: string;
  clientID: string;
  idpMetadata?: {
    thumbprint?: string;
    validTo?: string;
  };
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
    POST: handlePOST,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
};

const storeCertificateInfo = async (
  store: any,
  connection: ConnectionData,
  idpMetadata?: ConnectionData['idpMetadata']
) => {
  if (!idpMetadata?.thumbprint) return;

  const validToArr = idpMetadata.validTo?.split(',');

  await Promise.all(
    idpMetadata.thumbprint.split(',').map(async (thumbprint, i) => {
      const dbObj = {
        thumbprint,
        tenant: connection.tenant,
        product: connection.product,
        clientId: connection.clientID,
        validTo: validToArr?.[i],
      };

      const keyId = `${connection.clientID}:${thumbprint}`;
      await store.put(keyId, dbObj);
    })
  );
};

// Get all connections
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController, connectionAPIController } = await jackson();

  const { isSystemSSO } = req.query as {
    isSystemSSO?: string; // if present will be '' else undefined
  };

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const { tenant: adminPortalSSOTenant, product: adminPortalSSOProduct } = adminPortalSSODefaults;

  const paginatedConnectionList = await adminController.getAllConnection(pageOffset, pageLimit, pageToken);

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

  res.json(connections);
};

// Create a new connection
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();
  const _opts = defaultDb(jacksonOptions);
  const db = await DB.new({ db: _opts.db, logger });
  const notificationEventStore = db.store('cert:info');

  const { isSAML, isOIDC } = strategyChecker(req);

  await validateDevelopmentModeLimits(req.body.product, 'sso');

  if (!isSAML && !isOIDC) {
    throw new ApiError('Missing SSO connection params', 400);
  }

  // Create SAML connection
  if (isSAML) {
    const connection = await connectionAPIController.createSAMLConnection(req.body);

    // Store certificate information for each thumbprint
    await storeCertificateInfo(notificationEventStore, connection, connection.idpMetadata);
    res.status(201).json({ data: connection });
  }

  // Create OIDC connection
  else {
    const connection = await connectionAPIController.createOIDCConnection(oidcMetadataParse(req.body));
    res.status(201).json({ data: connection });
  }
};

// Update a connection
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();
  const _opts = defaultDb(jacksonOptions);
  const db = await DB.new({ db: _opts.db, logger });
  const notificationEventStore = db.store('cert:info');

  const { isSAML, isOIDC } = strategyChecker(req);

  if (!isSAML && !isOIDC) {
    throw new ApiError('Missing SSO connection params', 400);
  }

  const { clientID } = req.body as {
    clientID: string;
  };

  // Retrieve connection details before deletion to manage certificates
  const connections = await connectionAPIController.getConnections({
    clientID,
  });

  const connection = connections[0];
  // Update SAML connection
  if (isSAML) {
    // Remove all certificate entries for this connection
    const thumbprints = (connection as SAMLSSORecord).idpMetadata?.thumbprint?.split(',');

    if (thumbprints) {
      await Promise.all(
        thumbprints.map(async (thumbprint) => {
          const keyId = `${clientID}:${thumbprint}`;
          await notificationEventStore.delete(keyId);
        })
      );
    }
    await connectionAPIController.updateSAMLConnection(req.body);
    await storeCertificateInfo(notificationEventStore, req.body, req.body.idpMetadata);

    res.status(204).end();
  }

  // Update OIDC connection
  else {
    await connectionAPIController.updateOIDCConnection(oidcMetadataParse(req.body));
    res.status(204).end();
  }
};

// Delete a connection
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  // Initialize database for certificate management
  const _opts = defaultDb(jacksonOptions);
  const db = await DB.new({ db: _opts.db, logger });
  const notificationEventStore = db.store('cert:info');

  const { clientID, clientSecret } = req.query as {
    clientID: string;
    clientSecret: string;
  };

  if (!clientID || !clientSecret) {
    throw new ApiError('Missing client credentials', 400);
  }

  const connections = await connectionAPIController.getConnections({
    clientID,
  });

  const connection = connections[0];
  const isSAML =
    'rawMetadata' in connection ||
    'encodedRawMetadata' in connection ||
    'metadataUrl' in connection ||
    'isSAML' in connection;

  // Delete the connection
  await connectionAPIController.deleteConnections({ clientID, clientSecret });

  // Remove associated certificates if SAML connection
  if (isSAML && (connection as SAMLSSORecord).idpMetadata?.thumbprint) {
    try {
      // Remove all certificate entries for this connection
      const thumbprints = (connection as SAMLSSORecord).idpMetadata?.thumbprint?.split(',');

      if (thumbprints) {
        await Promise.all(
          thumbprints.map(async (thumbprint) => {
            const keyId = `${clientID}:${thumbprint}`;
            await notificationEventStore.delete(keyId);
          })
        );

        logger.info(`Removed ${thumbprints.length} certificates for connection ${clientID}`);
      }
    } catch (error) {
      // Log certificate removal errors but don't block the main deletion
      logger.error(`Error removing certificates for connection ${clientID}:`, error);
    }
  }

  res.json({ data: null });
};

export default handler;
