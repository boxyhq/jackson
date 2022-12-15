import type { NextApiRequest, NextApiResponse } from 'next';
import type { DirectoryType } from '@lib/jackson';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', 'POST, GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { name, tenant, product, type, webhook_url, webhook_secret } = req.body;

  const { data, error } = await directorySyncController.directories.create({
    name,
    tenant,
    product,
    type: type as DirectoryType,
    webhook_url,
    webhook_secret,
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

  const { offset, limit } = req.query as { offset: string; limit: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const { data, error } = await directorySyncController.directories.list({ pageOffset, pageLimit });

  if (data) {
    return res.status(200).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

export default checkSession(handler);
