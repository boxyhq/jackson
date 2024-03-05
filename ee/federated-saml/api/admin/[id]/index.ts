import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
};

// Get SAML Federation app by id
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

// Update SAML Federation app
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const updatedApp = await samlFederatedController.app.update(req.body);

  res.json({ data: updatedApp });
};

// Delete the SAML Federation app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  await samlFederatedController.app.delete({ id });

  res.json({ data: null });
};

export default handler;
