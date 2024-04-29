import { AppRequestParams } from '@boxyhq/saml-jackson';
import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { validateDevelopmentModeLimits } from '@lib/development-mode';
import { defaultHandler } from '@lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    POST: handlePOST,
    GET: handleGET,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
}

// Create a SAML federated app
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  await validateDevelopmentModeLimits(
    req.body.product,
    'samlFederation',
    'Maximum number of federation apps reached'
  );

  const app = await samlFederatedController.app.create(req.body);

  res.status(201).json({ data: app });
};

// Get a SAML federated app by ID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.get(req.query as AppRequestParams);

  res.json({ data: app });
};

// Update a SAML federated app
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.update(req.body);

  res.json({ data: app });
};

// Delete a SAML federated app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  await samlFederatedController.app.delete(req.query as AppRequestParams);

  res.json({ data: {} });
};
