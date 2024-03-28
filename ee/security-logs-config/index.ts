import { adminPortalSSODefaults, boxyhqHosted } from '@lib/env';
import jackson from '@lib/jackson';
import getSinkInstance from '@boxyhq/security-logs-sink';

export const sendSecurityLogs = async (event: any, tenant?: string) => {
  const { securityLogsConfigController } = await jackson();
  const tenantToUse = boxyhqHosted && tenant ? tenant : adminPortalSSODefaults.tenant;

  const configs = tenantToUse ? await securityLogsConfigController.getAll(tenantToUse) : { data: [] };
  for (const config of configs.data) {
    const sink = getSinkInstance({
      type: config.type,
      ...config.config,
    });
    await sink.sendEvent(event);
  }
};
