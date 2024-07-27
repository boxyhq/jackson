import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

// Get Providers list for dropdown
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const { tenant, filterByTenant: filterByTenantParam } = req.query;
  const filterByTenant = filterByTenantParam !== 'false';

  const providers = await chatController.getLLMProviders(tenant as string, filterByTenant);

  res.json({ data: providers });
};

export default handler;
