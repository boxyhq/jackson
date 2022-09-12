import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
}
