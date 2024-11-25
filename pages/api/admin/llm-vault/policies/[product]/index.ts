import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getPolicy,
    POST: savePolicy,
    PUT: updatePolicy,
    DELETE: deletePolicy,
  });
}

const getTerminusUrl = (product) => {
  return `${terminusOptions.hostUrl}/v1/manage/policies/${product}`;
};

const getPolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { product } = req.query;

  const { data } = await axios.get<any>(getTerminusUrl(product), {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.json({
    data,
    error: null,
  });
};

const savePolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { product } = req.query;

  const { data } = await axios.post<any>(getTerminusUrl(product), req.body, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.status(201).json({
    data,
    error: null,
  });
};

const updatePolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { product } = req.query;

  const { data } = await axios.put<any>(getTerminusUrl(product), req.body, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.status(201).json({
    data,
    error: null,
  });
};

const deletePolicy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { product } = req.query;

  const { data } = await axios.delete<any>(getTerminusUrl(product), {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
