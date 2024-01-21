import { JacksonOption, OryConfig, OryRes } from '../../typings';
import axios, { AxiosError } from 'axios';
import { throwIfInvalidLicense } from '../common/checkLicense';

const basePath = 'https://api.console.ory.sh';

export class OryController {
  private opts: JacksonOption;

  constructor({ opts }: { opts: JacksonOption }) {
    this.opts = opts;
  }

  private async createOrganization(config: OryConfig, label: string): Promise<string> {
    if (!config.sdkToken || !config.projectId) {
      throw new Error('Ory SDK Token or Project ID not set');
    }

    if (config && config.organizationId) {
      try {
        const res = await axios.get(
          `${basePath}/projects/${config.projectId}/organizations/${config.organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${config.sdkToken}`,
            },
          }
        );
        return res.data.organization.id;
      } catch (err) {
        // if org doesn't exist fall through to section that creates it below
        if ((err as AxiosError).response?.status !== 404) {
          throw err;
        }
      }
    }

    const res = await axios.post(
      `${basePath}/projects/${config.projectId}/organizations`,
      {
        label,
        domains: config.domains,
      },
      {
        headers: {
          Authorization: `Bearer ${config.sdkToken}`,
        },
      }
    );
    return res.data.id;
  }

  public async createConnection(config: OryConfig, label: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config))) {
      return null;
    }

    if (!config.sdkToken) {
      config.sdkToken = this.opts.ory.sdkToken;
    }
    if (!config.projectId) {
      config.projectId = this.opts.ory.projectId;
    }

    const organizationId = await this.createOrganization(config, label);
    axios.patch(
      `${basePath}/normalized/projects/${config.projectId}/revision/95106938-4a85-4cac-8788-4870e978a93f`,
      {},
      {
        headers: {
          Authorization: `Bearer ${config.sdkToken}`,
        },
      }
    );
    return { projectId: config.projectId, domains: config.domains, organizationId };
  }

  public async updateConnection(config: OryConfig, label: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config))) {
      return null;
    }

    if (!config.sdkToken) {
      config.sdkToken = this.opts.ory.sdkToken;
    }
    if (!config.projectId) {
      config.projectId = this.opts.ory.projectId;
    }

    const organizationId = await this.createOrganization(config, label);
    return { projectId: config.projectId, domains: config.domains, organizationId };
  }

  // const deleteConnection = async (config: OryConfig) => {};

  public async isEnabled(config: OryConfig): Promise<boolean> {
    if (this.opts.boxyhqHosted) {
      if (!config.sdkToken || !config.projectId) {
        return false;
      }
      return true;
    } else {
      if (!this.opts.ory.sdkToken || !this.opts.ory.projectId) {
        return false;
      }
      try {
        await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);
      } catch (err) {
        console.error('Ory is not enabled because of invalid license');
        return false;
      }
      return true;
    }
  }
}
