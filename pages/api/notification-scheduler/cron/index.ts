import { defaultHandler } from '@lib/api';
import { runScheduler } from '@lib/notifcation-scheduler/cron-runner';
import { NextApiRequest, NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await runScheduler();
    return res.json({ success: true, message: 'Scheduler executed successfully' });
  } catch (error) {
    console.error('Scheduler execution failed:', error);
    return res.json({ success: false, message: 'Scheduler execution failed' });
  }
};

export default handler;
