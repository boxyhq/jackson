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

const getTerminusUrl = (product: string) => {
  return `${terminusOptions.hostUrl}/v1/manage/policies/${product}`;
};

// Utility function to handle API requests
const handleApiRequest = async (
  method: 'get' | 'post' | 'put' | 'delete',
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { product } = req.query;
  const url = getTerminusUrl(product as string);

  try {
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `api-key ${terminusOptions.adminToken}`,
      },
      data: method !== 'get' ? req.body : undefined,
    });

    res.status(response.status).json({
      data: response.data,
      error: null,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      res.status(status).json({
        data: null,
        error: error.message,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        data: null,
        error: 'An unexpected error occurred',
      });
    }
  }
};

const getPolicy = (req: NextApiRequest, res: NextApiResponse) => handleApiRequest('get', req, res);
const savePolicy = (req: NextApiRequest, res: NextApiResponse) => handleApiRequest('post', req, res);
const updatePolicy = (req: NextApiRequest, res: NextApiResponse) => handleApiRequest('put', req, res);
const deletePolicy = (req: NextApiRequest, res: NextApiResponse) => handleApiRequest('delete', req, res);

export default handler;
