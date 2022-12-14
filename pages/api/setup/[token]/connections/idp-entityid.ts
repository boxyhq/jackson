import type { NextApiRequest, NextApiResponse } from 'next';
import jackson, { GetIDPEntityIDBody } from '@lib/jackson';

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
        case 'GET':
          return handleGET(res, setup);
        default:
          res.setHeader('Allow', ['GET']);
          res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
      }
    }
  }
};

const handleGET = async (res: NextApiResponse, setup: any) => {
  const { connectionAPIController } = await jackson();
  const idpEntityID = await connectionAPIController.getIDPEntityID({
    tenant: setup.tenant,
    product: setup.product,
  } as GetIDPEntityIDBody);
  return res.json(idpEntityID);
};

export default handler;
