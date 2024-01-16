import { IConnectionAPIController, IDirectorySyncController, Storable } from '../typings';
import Mixpanel from 'mixpanel';
import { randomUUID } from 'crypto';

const idKey = 'heartbeat';
const sentKey = 'lastSent';

export class AnalyticsController {
  analyticsStore: Storable;
  connectionAPIController: IConnectionAPIController;
  directorySyncController: IDirectorySyncController;
  client: Mixpanel.Mixpanel;
  anonymousId: string;

  constructor({ analyticsStore, connectionAPIController, directorySyncController }) {
    this.analyticsStore = analyticsStore;
    this.client = Mixpanel.init('1028494897a5520b90e7344344060fa7');
    this.connectionAPIController = connectionAPIController;
    this.directorySyncController = directorySyncController;
    this.anonymousId = '';
  }

  public async init(): Promise<void> {
    this.anonymousId = await this.analyticsStore.get(idKey);
    if (!this.anonymousId || this.anonymousId === '') {
      this.anonymousId = randomUUID();
      this.analyticsStore.put(idKey, this.anonymousId);
    }

    const sent = await this.analyticsStore.get(sentKey);
    const msBetweenDates = Math.abs(new Date().getTime() - new Date(sent || 0).getTime());
    const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

    if (hoursBetweenDates >= 24) {
      await this.send();
    }

    setInterval(
      async () => {
        await this.send();
      },
      60 * 60 * 24 * 1000
    );
  }

  async send() {
    try {
      const sso_connections_added = (await this.connectionAPIController.getCount()) || 'No count recorded';
      const dsync_connections_added =
        (await this.directorySyncController.directories.getCount()) || 'No count recorded';
      this.client.track(
        idKey,
        {
          distinct_id: this.anonymousId,
          'SSO Connections added': sso_connections_added,
          'Directory Sync Connections added': dsync_connections_added,
        },
        (err: Error | undefined) => {
          if (err) {
            setTimeout(
              () => {
                this.send();
              },
              1000 * 60 * 60
            );
            return;
          }

          this.analyticsStore.put(sentKey, new Date().toISOString());
        }
      );
    } catch (err) {
      console.error('Error sending analytics', err);
    }
  }
}
