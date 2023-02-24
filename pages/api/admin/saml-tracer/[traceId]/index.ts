import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { SAMLTrace, SAMLTracerInstance } from '@boxyhq/saml-jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlTracer } = await jackson();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGET(req, res, samlTracer);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Get SAML Trace by traceId
const handleGET = async (req: NextApiRequest, res: NextApiResponse, samlTracer: SAMLTracerInstance) => {
  const { traceId } = req.query as { traceId: string };

  const trace = await samlTracer.getByTraceId(traceId);
  const context = trace.context as SAMLTrace['context'];

  if ('samlResponse' in context) {
    // parse raw response and attach it to returned trace
  }

  if (!trace) {
    return res.status(404).json({ error: { message: 'Trace not found.' } });
  }

  return res.json({ data: trace });
};

export default handler;
