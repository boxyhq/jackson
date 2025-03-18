import { getEventProcessor } from './index';

export async function runScheduler() {
  const processor = getEventProcessor();
  await (await processor).processEvents();
}
