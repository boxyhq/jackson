import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { IAdminController } from '@boxyhq/saml-jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  try {
    const { adminController } = await jackson();

    switch (method) {
      case 'GET':
        return await handleGET(req, res, adminController);
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
const handleGET = async (req: NextApiRequest, res: NextApiResponse, adminController: IAdminController) => {
  const { traceId } = req.query as { traceId: string };

  const trace = await adminController.getSSOTraceById(traceId);

  if (!trace) {
    return res.status(404).json({ error: { message: 'Trace not found.' } });
  }

  return res.json({ data: trace });
};

export default handler;
