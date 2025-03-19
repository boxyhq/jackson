import { defaultHandler } from '@lib/api';
import { getEventProcessor } from '@lib/notifcation-scheduler';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    POST: handlePOST,
  });
};

export async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, templateId, scheduledFor } = await req.body;

    const processor = getEventProcessor();
    const event = await (
      await processor
    ).scheduleEvent('send-daily-notifications', { userId, templateId }, new Date(scheduledFor));

    return res.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return res.json({ success: false, message: 'Failed to schedule notification' });
  }
}

export default handler;
