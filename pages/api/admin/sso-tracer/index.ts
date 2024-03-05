import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
  });
};

// Get SAML Traces
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController } = await jackson();

  const { offset, limit, pageToken } = req.query as { offset: string; limit: string; pageToken?: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const tracesPaginated = await adminController.getAllSSOTraces(pageOffset, pageLimit, pageToken);

  if (tracesPaginated.pageToken) {
    res.setHeader('jackson-pagetoken', tracesPaginated.pageToken);
  }

  res.json({ data: tracesPaginated.data });
};

export default handler;
