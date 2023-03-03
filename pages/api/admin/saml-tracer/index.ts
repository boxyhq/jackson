import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { SAMLTracerInstance } from '@boxyhq/saml-jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlTracer } = await jackson();
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res, samlTracer);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Get SAML Traces
const handleGET = async (req: NextApiRequest, res: NextApiResponse, samlTracer: SAMLTracerInstance) => {
  const { offset, limit } = req.query as { offset: string; limit: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const traces = (await samlTracer.getAllTraces(pageOffset, pageLimit)) || [];

  return res.json({ data: traces });
};

export default handler;
