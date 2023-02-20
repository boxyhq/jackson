import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { strings } from '@lib/strings';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return res.status(404).json({
      error: {
        message: strings['enterprise_license_not_found'],
      },
    });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGET(req, res);
      default:
        res.setHeader('Allow', 'POST, GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Get SAML Traces
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlTracer } = await jackson();

  const { offset, limit } = req.query as { offset: string; limit: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const traces = (await samlTracer?.getAllTraces(pageOffset, pageLimit)) || [];

  return res.json({ data: traces });
};

export default handler;
