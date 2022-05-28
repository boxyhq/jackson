import type { NextApiRequest, NextApiResponse } from 'next';

// Sample webhook handler for testing
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { body, headers } = req;

  console.log({ 'boxyhq-signature': headers['boxyhq-signature'], body });

  return res.json({});
}
