import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { PaginateApiParams } from 'types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      case 'GET':
        return await handleGET(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', 'POST, GET, DELETE');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Create a new setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const setupLink = await setupLinkController.create(req.body);

  return res.status(201).json({ data: setupLink });
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { id } = req.query as { id: string };

  await setupLinkController.remove({ id });

  return res.json({ data: {} });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { token, service, pageToken } = req.query as PaginateApiParams & {
    token: string;
    service: string;
  };

  let pageOffset, pageLimit;

  if ('offset' in req.query && 'limit' in req.query) {
    pageOffset = req.query.offset;
    pageLimit = req.query.limit;
  } else if ('pageOffset' in req.query && 'pageLimit' in req.query) {
    pageOffset = req.query.pageOffset;
    pageLimit = req.query.pageLimit;
  }

  if (!token && !service) {
    return res.status(404).json({
      error: {
        message: 'Setup link is invalid',
        code: 404,
      },
    });
  }

  // Get a setup link by token
  if (token) {
    const setupLink = await setupLinkController.getByToken(token);

    return res.json({ data: setupLink });
  }

  // Get a setup link by service
  if (service) {
    const setupLinksPaginated = await setupLinkController.filterBy({
      service: service as any,
      pageLimit: parseInt(pageLimit),
      pageOffset: parseInt(pageOffset),
      pageToken,
    });

    if (setupLinksPaginated.pageToken) {
      res.setHeader('jackson-pagetoken', setupLinksPaginated.pageToken);
    }

    return res.json({ data: setupLinksPaginated.data });
  }
};

export default handler;
