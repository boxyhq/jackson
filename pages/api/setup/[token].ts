import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Create a new setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { tenant, product, type: path, regenerate } = req.body;

  const { data, error } = await setupLinkController.create({
    tenant,
    product,
    path,
    regenerate,
  });

  return res.status(error ? error.code : 201).json({ data, error });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();
  const token = req.query.token;
  if (token === 'undefined' || token === null || !token) {
    return res.status(404).json({
      data: undefined,
      error: {
        message: 'Setup link is invalid',
        code: 404,
      },
    });
  } else {
    const { data, error } = await setupLinkController.getByToken(req.query.token);

    return res.status(error ? error.code : 200).json({ data, error });
  }
};

export default handler;
