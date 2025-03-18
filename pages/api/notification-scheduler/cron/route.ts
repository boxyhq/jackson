import { runScheduler } from '@lib/notifcation-scheduler/cron-runner';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log(request);
    await runScheduler();
    return NextResponse.json({ success: true, message: 'Scheduler executed successfully' });
  } catch (error) {
    console.error('Scheduler execution failed:', error);
    return NextResponse.json({ success: false, message: 'Scheduler execution failed' }, { status: 500 });
  }
}
