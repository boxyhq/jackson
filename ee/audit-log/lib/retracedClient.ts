import * as Retraced from '@retracedhq/retraced';

import { retracedOptions } from '@lib/env';

export const getRetracedClient = async () => {
  if (!retracedOptions.hostUrl) {
    throw new Error('Please set `RETRACED_HOST_URL` in your environment');
  }

  if (!retracedOptions.apiKey) {
    throw new Error('Please set `RETRACED_API_KEY` in your environment');
  }

  if (!retracedOptions.projectId) {
    throw new Error('Please set `RETRACED_PROJECT_ID` in your environment');
  }

  return new Retraced.Client({
    endpoint: retracedOptions.hostUrl,
    apiKey: retracedOptions.apiKey,
    projectId: retracedOptions.projectId,
  });
};
