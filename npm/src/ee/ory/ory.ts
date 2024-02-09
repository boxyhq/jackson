import { JacksonOption, OryConfig, OryRes } from '../../typings';
import axios, { AxiosError } from 'axios';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { ProductController } from '../product';

const basePath = 'https://api.console.ory.sh';
const providerId = 'sso_boxyhq';
const dataMapping =
  'base64://bG9jYWwgY2xhaW1zID0gewogIGVtYWlsX3ZlcmlmaWVkOiB0cnVlLAp9ICsgc3RkLmV4dFZhcignY2xhaW1zJyk7Cgp7CiAgaWRlbnRpdHk6IHsKICAgIHRyYWl0czogewogICAgICBbaWYgJ2VtYWlsJyBpbiBjbGFpbXMgJiYgY2xhaW1zLmVtYWlsX3ZlcmlmaWVkIHRoZW4gJ2VtYWlsJyBlbHNlIG51bGxdOiBjbGFpbXMuZW1haWwsCiAgICB9LAogIH0sCn0=';
const issuerUrl = 'https://sso.eu.boxyhq.com';

export class OryController {
  private opts: JacksonOption;
  private productController: ProductController;

  constructor({ opts, productController }: { opts: JacksonOption; productController: ProductController }) {
    this.opts = opts;
    this.productController = productController;
  }

  private getOrgName(tenant: string, product: string): string {
    return this.opts.boxyhqHosted ? tenant : `${tenant}:${product}`;
  }

  private getIssuerUrl() {
    if (this.opts.boxyhqHosted) {
      return issuerUrl;
    } else {
      return this.opts.externalUrl;
    }
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
    } catch (err) {
      // empty
    }

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
            issuer_url: this.getIssuerUrl(),
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
      config.sdkToken = this.opts.ory?.sdkToken;
    }
    if (!config.projectId) {
      config.projectId = this.opts.ory?.projectId;
    }
    config.domains = config.domains || [];
    if (!config.domains.includes(tenant)) {
      config.domains.push(tenant);
    }
    return config;
  }

  public async createConnection(config: OryConfig, tenant: string, product: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config, tenant, product))) {
      return null;
    }

    const organizationId = await this.createOrganization(config, this.getOrgName(tenant, product));
    config.organizationId = organizationId;

    let error;
    try {
      await this.addOrUpdateConnection(config, tenant, product);
    } catch (err) {
      error = err;
    }

    return { projectId: config.projectId, domains: config.domains, organizationId, error };
  }

  public async updateConnection(config: OryConfig, tenant: string, product: string): Promise<OryRes | null> {
    if (!(await this.isEnabled(config, tenant, product))) {
      return null;
    }

    const organizationId = await this.createOrganization(config, this.getOrgName(tenant, product));

    let error;
    try {
      await this.addOrUpdateConnection(config, tenant, product);
    } catch (err) {
      error = err;
    }

    return { projectId: config.projectId, domains: config.domains, organizationId, error };
  }

  private async isEnabled(config: OryConfig, tenant: string, product: string): Promise<boolean> {
    if (this.opts.boxyhqHosted) {
      const productConfig = await this.productController.get(product);
      if (
        !productConfig ||
        !productConfig.ory ||
        !productConfig.ory.sdkToken ||
        !productConfig.ory.projectId
      ) {
        return false;
      }

      config.sdkToken = productConfig.ory.sdkToken;
      config.projectId = productConfig.ory.projectId;

      this.sanitizeConfig(config, tenant);

      return true;
    } else {
      if (!this.opts.ory?.sdkToken || !this.opts.ory?.projectId) {
        return false;
      }
      try {
        await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);
      } catch (err) {
        console.error('Ory is not enabled because of invalid license');
        return false;
      }
      this.sanitizeConfig(config, tenant);
      return true;
    }
  }
}
