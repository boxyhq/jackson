import type { NextApiRequest, NextApiResponse } from 'next';
import type { DirectoryType } from '@lib/jackson';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const { setupLinkController } = await jackson();
  const token = req.query.token;
  let data, error;
  if (!token) {
    data = undefined;
    error = {
      code: 404,
      message: 'Invalid setup token!',
    };
    res.status(error ? error.code : 201).json({ data, error });
  } else {
    const { data: setup, error: err } = await setupLinkController.getByToken(token);
    if (err) {
      res.status(err ? err.code : 201).json({ err });
    } else if (!setup) {
      data = undefined;
      error = {
        code: 404,
        message: 'Invalid setup token!',
      };
      res.status(error ? error.code : 201).json({ data, error });
    } else if (setup?.validTill < +new Date()) {
      data = undefined;
      error = {
        code: 400,
        message: 'Setup Link expired!',
      };
      return res.status(error ? error.code : 201).json({ data, error });
    } else {
      switch (method) {
        case 'POST':
          return handlePOST(req, res, setup);
        default:
          res.setHeader('Allow', ['POST']);
          res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
      }
    }
  }
};

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse, setup: any) => {
  const { directorySyncController } = await jackson();

  const { name, type, webhook_url, webhook_secret } = req.body;

  const { data, error } = await directorySyncController.directories.create({
    name,
    tenant: setup.tenant,
    product: setup.product,
    type: type as DirectoryType,
    webhook_url,
    webhook_secret,
  });

  return res.status(error ? error.code : 201).json({ data, error });
};

export default handler;
