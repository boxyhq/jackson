import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
    POST: handlePOST,
  });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { brandingController } = await jackson();

  const { logoUrl, faviconUrl, companyName, primaryColor } = req.body;

  res.json({
    data: await brandingController.update({ logoUrl, faviconUrl, companyName, primaryColor }),
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { brandingController } = await jackson();

  res.json({ data: await brandingController.get() });
};

export default handler;
