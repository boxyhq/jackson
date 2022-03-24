import { IHealthCheckController, Storable } from '../typings';
import { JacksonError } from './error';
const testNameSpace = 'test:config';
const testDbKey = '1234567890987654321';
const upStatus = 'up';
const downStatus = 'down';
const value = 'Value';

export class HealthCheckController implements IHealthCheckController {
  healthCheckStore: Storable;

  constructor({ healthCheckStore }) {
    this.healthCheckStore = healthCheckStore;
    this.init();
  }
  async init(): Promise<HealthCheckController> {
    this.healthCheckStore.put(testDbKey, value);
    return this;
  }

  public async healthCheck(): Promise<any> {
    const response = await Promise.race([
      this.healthCheckStore.get(testDbKey),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ])
      .then((value) => {
        return value;
      })
      .catch(function (err) {
        console.log(err);
        throw new JacksonError('DB Service is Unavailable', 503);
      });
    try {
      if (response) {
        return upStatus;
      }
      if (!response) {
        throw new JacksonError('DB Service is Unavailable', 503);
      }
    } catch (err) {
      console.log(err);
      throw new JacksonError('DB Service is Unavailable', 503);
    }
  }

  public async completeHealthCheck(isJacksonReady): Promise<any> {
    const response = await Promise.race([
      this.healthCheckStore.get(testDbKey),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ])
      .then((value) => {
        return value;
      })
      .catch(function (err) {
        console.log(err);
        throw new JacksonError('DB Service is Unavailable', 503);
      });
    try {
      if (response && isJacksonReady) {
        return { status: 200, healthy: true, ready: true };
      } else if (response && !isJacksonReady) {
        return { status: 200, healthy: true, ready: false };
      } else if (!response && isJacksonReady) {
        return { status: 200, healthy: false, ready: true };
      } else {
        return { status: 503, healthy: false, ready: false };
      }
    } catch (err) {
      console.log(err);
      throw new JacksonError('DB Service is Unavailable', 503);
    }
  }
}
