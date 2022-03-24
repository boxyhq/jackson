import { IHealthCheckController, Storable } from '../typings';
import { JacksonError } from './error';
export class HealthCheckController implements IHealthCheckController {
  healthCheckStore: Storable;
  testNameSpace = 'test:config';
  testDbKey = '1234567890987654321';
  upStatus = 'up';
  downStatus = 'down';
  jsonObject = {
    iv: 'Iv Value',
    tag: 'Tag Value',
    value: 'Value',
  };
  constructor({ healthCheckStore }) {
    this.healthCheckStore = healthCheckStore;
    this.init();
  }
  async init(): Promise<HealthCheckController> {
    this.healthCheckStore.put(this.testDbKey, this.jsonObject);
    return this;
  }

  public async healthCheck(): Promise<any> {
    const response = await Promise.race([
      this.healthCheckStore.get(this.testDbKey),
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
        return 200;
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
      this.healthCheckStore.get(this.testDbKey),
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
