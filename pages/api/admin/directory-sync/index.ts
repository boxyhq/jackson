import type { NextApiRequest, NextApiResponse } from 'next';
import type { DirectoryType } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      return await handlePOST(req, res);
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'POST, GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { name, tenant, product, type, webhook_url, webhook_secret, google_domain } = req.body;

  const { data, error } = await directorySyncController.directories.create({
    name,
    tenant,
    product,
    type: type as DirectoryType,
    webhook_url,
    webhook_secret,
    google_domain,
  });

  if (data) {
    return res.status(201).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { pageOffset, pageLimit, pageToken } = req.query as {
    pageOffset: string;
    pageLimit: string;
    pageToken?: string;
  };

  const {
    data,
    error,
    pageToken: nextPageToken,
  } = await directorySyncController.directories.getAll({
    pageOffset: +(pageOffset || 0),
    pageLimit: +(pageLimit || 0),
    pageToken,
  });

  if (nextPageToken) {
    res.setHeader('jackson-pagetoken', nextPageToken);
  }

  if (data) {
    return res.status(200).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

export default handler;
