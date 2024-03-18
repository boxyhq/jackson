import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import retraced from '@ee/retraced';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
};

// Get Identity Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  const app = await samlFederatedController.app.get({ id });
  const metadata = await samlFederatedController.app.getMetadata();

  res.json({
    data: {
      ...app,
      metadata,
    },
  });
};

// Update Identity Federation app
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const updatedApp = await samlFederatedController.app.update(req.body);

  retraced.reportAdminPortalEvent({
    action: 'federation.app.update',
    crud: 'u',
    req,
    target: {
      id: updatedApp.id,
    },
  });

  res.json({ data: updatedApp });
};

// Delete the Identity Federation app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  await samlFederatedController.app.delete({ id });

  retraced.reportAdminPortalEvent({
    action: 'federation.app.delete',
    crud: 'd',
    req,
    target: {
      id,
    },
  });

  res.json({ data: null });
};

export default handler;
