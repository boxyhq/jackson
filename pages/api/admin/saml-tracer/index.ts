import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { IAdminController } from '@boxyhq/saml-jackson';
import { sendAudit } from '@ee/audit-log/lib/retraced';

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

// Get SAML Traces
const handleGET = async (req: NextApiRequest, res: NextApiResponse, adminController: IAdminController) => {
  const { offset, limit, pageToken } = req.query as { offset: string; limit: string; pageToken?: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const tracesPaginated = await adminController.getAllSAMLTraces(pageOffset, pageLimit, pageToken);

  if (tracesPaginated.pageToken) {
    res.setHeader('jackson-pagetoken', tracesPaginated.pageToken);
  }

  await sendAudit({
    action: 'saml.tracer.view',
    crud: 'r',
    req,
  });

  return res.json({ data: tracesPaginated.data });
};

export default handler;
