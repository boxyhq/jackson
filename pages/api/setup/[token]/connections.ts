import type { NextApiRequest, NextApiResponse } from 'next';
import jackson, { GetConnectionsQuery } from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController, connectionAPIController } = await jackson();
  const token = req.query.token;
  const { data: setup, error: err } = await setupLinkController.getByToken(token);
  if (err) {
    return res.status(err ? err.code : 201).json({ err });
  }
  let data, error;
  if (setup) {
    if (setup?.validTill > +new Date()) {
      data = setup;
      return res.json(
        await connectionAPIController.getConnections({
          tenant: setup.tenant,
          product: setup.product,
        } as GetConnectionsQuery)
      );
    } else {
      data = undefined;
      error = {
        code: 400,
        message: 'Setup Link expired!',
      };
    }
  } else {
    data = undefined;
    error = {
      code: 404,
      message: 'Invalid setup token!',
    };
  }

  return res.status(error ? error.code : 201).json({ data, error });
};

export default handler;
