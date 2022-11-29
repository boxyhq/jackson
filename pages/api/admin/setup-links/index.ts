import type { NextApiRequest, NextApiResponse } from 'next';
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
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Create a new setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { tenant, product, type: service, regenerate } = req.body;

  const { data, error } = await setupLinkController.create({
    tenant,
    product,
    service,
    regenerate,
  });

  return res.status(error ? error.code : 201).json({ data, error });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();
  const token = req.query.token;
  const service = req.query.service;
  if (token) {
    const { data, error } = await setupLinkController.getByToken(req.query.token);

    return res.status(error ? error.code : 200).json({ data, error });
  } else if (service) {
    const { data, error } = await setupLinkController.getByService(req.query.service);
    return res.status(error ? error.code : 200).json({ data, error });
  } else {
    return res.status(404).json({
      data: undefined,
      error: {
        message: 'Setup link is invalid',
        code: 404,
      },
    });
  }
};

export default checkSession(handler);
