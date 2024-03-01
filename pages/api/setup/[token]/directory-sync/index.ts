import type { NextApiRequest, NextApiResponse } from 'next';
import type { SetupLink } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { method } = req;
  const { token } = req.query as { token: string };

  try {
    const setupLink = await setupLinkController.getByToken(token);

    switch (method) {
      case 'POST':
        return await handlePOST(req, res, setupLink);
      case 'GET':
        return await handleGET(req, res, setupLink);
      default:
        res.setHeader('Allow', 'PUT');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { directorySyncController } = await jackson();

  const { type, google_domain } = req.body;

  const directory = {
    type,
    google_domain,
    name: setupLink.name,
    tenant: setupLink.tenant,
    product: setupLink.product,
    webhook_url: setupLink.webhook_url,
    webhook_secret: setupLink.webhook_secret,
  };

  const { data, error } = await directorySyncController.directories.create(directory);

  if (data) {
    return res.status(201).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

// Get all configurations
const handleGET = async (req: NextApiRequest, res: NextApiResponse, setupLink: SetupLink) => {
  const { directorySyncController } = await jackson();

  const { offset, limit, pageToken } = req.query as { offset: string; limit: string; pageToken?: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const {
    data,
    error,
    pageToken: nextPageToken,
  } = await directorySyncController.directories.getAll({
    pageOffset,
    pageLimit,
    pageToken,
  });

  if (nextPageToken) {
    res.setHeader('jackson-pagetoken', nextPageToken);
  }

  if (data) {
    const filteredData = data.filter(
      (directory) => directory.tenant === setupLink.tenant && directory.product === setupLink.product
    );

    return res.status(200).json({ data: filteredData });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

export default handler;
