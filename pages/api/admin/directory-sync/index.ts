import type { NextApiRequest, NextApiResponse } from 'next';
import type { DirectoryType } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';
import { withAdmin } from '@lib/withAdmin';
import { ApiError } from '@lib/error';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await withAdmin(req, res, {
    GET: handleGET,
    POST: handlePOST,
  });
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

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  res.status(201).json({ data });
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

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  res.json({ data });
};

export default handler;
