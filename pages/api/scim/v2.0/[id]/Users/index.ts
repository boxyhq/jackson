import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEvent } from '@lib/webhook';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
    Resources: [],
  });
};

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = JSON.parse(req.body);

  sendEvent({
    event: 'user.created',
    type: 'user',
    payload: body,
  });

  // id should come from the SP. Without id the response will fail
  body['id'] = '23a35c27-23d3-4c03-b4c5-6443c09e7171';

  return res.json(body);
};
