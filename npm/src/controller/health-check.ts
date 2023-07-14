import { IHealthCheckController, Storable } from '../typings';
import { JacksonError } from './error';
const healthKey = 'amihealthy';
const healthValue = 'fit';

const g = global as any;

export class HealthCheckController implements IHealthCheckController {
  healthCheckStore: Storable;

  constructor({ healthCheckStore }) {
    this.healthCheckStore = healthCheckStore;
  }

  public async init(): Promise<void> {
    this.healthCheckStore.put(healthKey, healthValue);
  }

  public async status(): Promise<{
    status: number;
  }> {
    try {
      if (!g.jacksonInstance) {
        return {
          status: 503,
        };
      }
      const response = await Promise.race([
        this.healthCheckStore.get(healthKey),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
      ]);

      if (response === healthValue) {
        return {
          status: 200,
        };
      }

      return {
        status: 503,
      };
    } catch (err) {
      throw new JacksonError('Service not available', 503);
    }
  }
}
