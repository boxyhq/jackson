import { JacksonOption, OryConfig, OryRes } from '../../typings';
import axios, { AxiosError } from 'axios';
import { throwIfInvalidLicense } from '../common/checkLicense';

const basePath = 'https://api.console.ory.sh';
const providerId = 'sso_boxyhq';
const dataMapping =
  'base64://bG9jYWwgY2xhaW1zID0gewogIGVtYWlsX3ZlcmlmaWVkOiB0cnVlLAp9ICsgc3RkLmV4dFZhcignY2xhaW1zJyk7Cgp7CiAgaWRlbnRpdHk6IHsKICAgIHRyYWl0czogewogICAgICBbaWYgJ2VtYWlsJyBpbiBjbGFpbXMgJiYgY2xhaW1zLmVtYWlsX3ZlcmlmaWVkIHRoZW4gJ2VtYWlsJyBlbHNlIG51bGxdOiBjbGFpbXMuZW1haWwsCiAgICB9LAogIH0sCn0=';
const issuerUrl = 'https://sso.eu.boxyhq.com';

export class OryController {
  private opts: JacksonOption;

  constructor({ opts }: { opts: JacksonOption }) {
    this.opts = opts;
  }

  private async addOrUpdateConnection(config: OryConfig, tenant: string, product: string): Promise<void> {
    const project = await axios.get(`${basePath}/projects/${config.projectId}`, {
      headers: {
        Authorization: `Bearer ${config.sdkToken}`,
      },
    });

    let index = '-';
    try {
      for (const idx in project.data.services.identity.config.selfservice.methods.oidc.config.providers) {
        const provider = project.data.services.identity.config.selfservice.methods.oidc.config.providers[idx];
        if (provider.id === providerId && provider.organization_id === config.organizationId) {
          index = idx;
          break;
        }
      }
    } catch (err) {}

    const op = index === '-' ? 'add' : 'replace';

    await axios.patch(
      `${basePath}/normalized/projects/${config.projectId}/revision/${project.data.revision_id}`,
      [
        { op: 'replace', path: '/kratos_selfservice_methods_oidc_enabled', value: true },
        {
          op,
          path: `/kratos_selfservice_methods_oidc_config_providers/${index}`,
          value: {
            provider_id: providerId,
            provider: 'generic',
            label: 'SSO',
            client_id: `tenant=${tenant}&product=${product}`,
            client_secret: this.opts.clientSecretVerifier,
            organization_id: config.organizationId,
            scope: [],
            mapper_url: dataMapping,
            additional_id_token_audiences: [],
            issuer_url: issuerUrl,
          },
        },
      ],
      {
        headers: {
          Authorization: `Bearer ${config.sdkToken}`,
        },
      }
    );
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

  private async sanitizeConfig(config: OryConfig, tenant: string): Promise<OryConfig> {
    if (!config.sdkToken) {
      config.sdkToken = this.opts.ory.sdkToken;
    }
    if (!config.projectId) {
      config.projectId = this.opts.ory.projectId;
    }
    config.domains = config.domains || [];
    if (!config.domains.includes(tenant)) {
      config.domains.push(tenant);
    }
    return config;
  }

  public async createConnection(config: OryConfig, tenant: string, product: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config))) {
      return null;
    }

    this.sanitizeConfig(config, tenant);

    const organizationId = await this.createOrganization(config, `${tenant}:${product}`);
    config.organizationId = organizationId;

    await this.addOrUpdateConnection(config, tenant, product);

    return { projectId: config.projectId, domains: config.domains, organizationId };
  }

  public async updateConnection(config: OryConfig, tenant: string, product: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config))) {
      return null;
    }

    this.sanitizeConfig(config, tenant);

    const organizationId = await this.createOrganization(config, `${tenant}:${product}`);

    await this.addOrUpdateConnection(config, tenant, product);

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
