import { getEventProcessor } from '@lib/notifcation-scheduler';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, templateId, scheduledFor } = await request.json();

    const processor = getEventProcessor();
    const event = await (
      await processor
    ).scheduleEvent('send-daily-notifications', { userId, templateId }, new Date(scheduledFor));

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return NextResponse.json({ success: false, message: 'Failed to schedule notification' }, { status: 500 });
  }
}
