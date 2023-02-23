import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { SAMLTracerInstance } from '@boxyhq/saml-jackson';
import { strings } from '@lib/strings';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense, samlTracer } = await jackson();

  if (!(await checkLicense())) {
    return res.status(403).json({
      error: {
        message: strings['enterprise_license_not_found'],
      },
    });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGET(req, res, samlTracer as SAMLTracerInstance);
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
