import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { IAdminController } from '@boxyhq/saml-jackson';
import { PaginateApiParams } from 'types';

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
  const params = req.query as PaginateApiParams;

  let pageOffset, pageLimit;
  if ('offset' in params && 'limit' in params) {
    pageOffset = params.offset;
    pageLimit = params.limit;
  } else if ('pageOffset' in params && 'pageLimit' in params) {
    pageOffset = params.pageOffset;
    pageLimit = params.pageLimit;
  }

  const pageToken = params.pageToken;

  const tracesPaginated = await adminController.getAllSSOTraces(
    parseInt(pageOffset),
    parseInt(pageLimit),
    pageToken
  );

  if (tracesPaginated.pageToken) {
    res.setHeader('jackson-pagetoken', tracesPaginated.pageToken);
  }

  return res.json({ data: tracesPaginated.data });
};

export default handler;
