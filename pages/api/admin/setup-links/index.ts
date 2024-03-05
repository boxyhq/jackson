import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';
import { ApiError } from '@lib/error';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
    POST: handlePOST,
    DELETE: handleDELETE,
  });
};

// Create a new setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const setupLink = await setupLinkController.create(req.body);

  res.status(201).json({ data: setupLink });
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { id } = req.query as { id: string };

  await setupLinkController.remove({ id });

  res.json({ data: {} });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { token, service, pageOffset, pageLimit, pageToken } = req.query as {
    pageOffset: string;
    pageLimit: string;
    pageToken?: string;
    token: string;
    service: string;
  };

  if (!token && !service) {
    throw new ApiError(400, 'Either token or service is required');
  }

  // Get a setup link by token
  if (token) {
    const setupLink = await setupLinkController.getByToken(token);

    res.json({ data: setupLink });
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

    res.json({ data: setupLinksPaginated.data });
  }
};

export default handler;
