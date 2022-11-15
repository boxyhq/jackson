import type { NextApiRequest, NextApiResponse } from 'next';

import { checkSession } from '@lib/middleware';
import jackson from '@lib/jackson';

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

// Get SAML Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  const { id } = req.query as { id: string };

  try {
    const { data: app } = await samlFederation.app.get(id);
    const { data: metadata } = await samlFederation.app.getMetadata(id);

    return res.status(200).json({
      data: {
        ...app,
        metadata,
      },
    });
  } catch (error: any) {
    const { message, statusCode } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);

// Error, Send proper http status code with the response
// {
//   message: "There is an error with the request. Please try again.",
//   code: 500,
// }

// Success, Send proper http status code with the response
// {
//   data: {
//     id: "saml-federation-app-id",
//   }
// }
