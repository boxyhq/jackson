import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getModel(req, res);
    case 'POST':
      return await saveModel(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const getTerminusUrl = (id) => {
  return `${terminusOptions.hostUrl}/v1/admin/${id}/model`;
};

const getModel = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  const { data } = await axios.get<any>(getTerminusUrl(id), {
    headers: {
      Authorization: `token=${terminusOptions.adminToken}`, // TODO: Implement this on terminus
      'x-access-token': terminusOptions.adminToken, // TODO: Remove this
    },
  });

  return res.status(201).json({
    data,
    error: null,
  });
};

const saveModel = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  const { data } = await axios.post<any>(getTerminusUrl(id), req.body, {
    headers: {
      Authorization: `token=${terminusOptions.adminToken}`, // TODO: Implement this on terminus
      'x-access-token': terminusOptions.adminToken, // TODO: Remove this
    },
  });

  return res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
