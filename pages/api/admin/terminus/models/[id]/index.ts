import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import type { Project } from 'types/retraced';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getModel(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const CONF_PROXY_X_ACCESS_TOKEN = 'adminAPIKey1';

const getModel = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  const { data } = await axios.get<{ project: Project }>(`http://localhost:3002/v1/admin/${id}/model`, {
    headers: {
      Authorization: `token=${CONF_PROXY_X_ACCESS_TOKEN}`,
      'x-access-token': CONF_PROXY_X_ACCESS_TOKEN,
    },
  });

  return res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
