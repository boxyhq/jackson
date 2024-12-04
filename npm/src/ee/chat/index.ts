import crypto from 'crypto';
import axios from 'axios';
import * as jose from 'jose';
import type {
  Storable,
  JacksonOption,
  LLMConfigMergedFromVault,
  LLMProvidersOptionsType,
  LLMProvider,
  LLMModel,
} from '../../typings';
import * as dbutils from '../../db/utils';
import { IndexNames, loadJWSPrivateKey } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { LLMChat, LLMConfig, LLMConfigPayload, LLMConversation } from './types';
import { JacksonError } from '../../controller/error';
import { LLM_PROVIDERS } from './llm-providers';

export class ChatController {
  private chatStore: Storable;
  private conversationStore: Storable;
  private llmConfigStore: Storable;
  private opts: JacksonOption;

  constructor({
    chatStore,
    conversationStore,
    llmConfigStore,
    opts,
  }: {
    chatStore: Storable;
    conversationStore: Storable;
    llmConfigStore: Storable;
    opts: JacksonOption;
  }) {
    this.llmConfigStore = llmConfigStore;
    this.chatStore = chatStore;
    this.conversationStore = conversationStore;
    this.opts = opts;
  }

  private async getLLMConfigsByTenant(tenant: string): Promise<LLMConfig[]> {
    return (await this.llmConfigStore.getByIndex({ name: IndexNames.Tenant, value: tenant })).data;
  }

  public async getLLMConfigFromVault(
    tenant: string,
    token: string
  ): Promise<{
    apiKey: string;
    baseURL: string;
  }> {
    const res = await axios.get(
      `${this.opts.terminus?.hostUrl}/v1/vault/${tenant}/${this.opts.terminus?.llm?.product}/data?token=${token}`,
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.read}` } }
    );

    if (res.data[token]) {
      return JSON.parse(res.data[token]?.data);
    } else {
      throw new JacksonError('Config not found in Vault', 404);
    }
  }

  public async getLLMConfigs(tenant: string): Promise<LLMConfigMergedFromVault[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const configs = await this.getLLMConfigsByTenant(tenant);
    for (let i = 0; i < configs.length; i++) {
      const data = await this.getLLMConfigFromVault(tenant, configs[i].terminusToken);
      if (data) {
        configs[i] = {
          ...configs[i],
          terminusToken: '',
          apiKey: '*'.repeat(data.apiKey.length),
        } as any;
      }
    }
    return configs as LLMConfigMergedFromVault[];
  }

  public async getLLMConfigsByTenantAndProvider(tenant: string, provider: LLMProvider): Promise<LLMConfig[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return (
      await this.llmConfigStore.getByIndex({
        name: IndexNames.TenantProvider,
        value: dbutils.keyFromParts(tenant, provider),
      })
    ).data;
  }

  private async storeLLMConfig(config: Omit<LLMConfig, 'id' | 'createdAt'>) {
    const id = crypto.randomBytes(20).toString('hex');
    const createdAt = Date.now();
    await this.llmConfigStore.put(
      id,
      { ...config, id, createdAt },
      // secondary index on tenant
      { name: IndexNames.Tenant, value: config.tenant },
      // secondary index on tenant + provider
      { name: IndexNames.TenantProvider, value: dbutils.keyFromParts(config.tenant, config.provider) }
    );
    return { id, createdAt, ...config };
  }

  private async saveLLMConfigInVault({
    tenant,
    apiKey,
  }: {
    tenant: string;
    provider: string;
    apiKey?: string;
    baseURL?: string;
  }): Promise<string | undefined> {
    const res = await axios.post(
      `${this.opts.terminus?.hostUrl}/v1/vault/${tenant}/${this.opts.terminus?.llm?.product}/data`,
      {
        apiKey: apiKey || '',
      },
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` } }
    );

    if (res.data?.token) {
      return res.data.token;
    }
  }

  public async createLLMConfig(llmConfig: LLMConfigPayload): Promise<LLMConfig> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const { apiKey, provider, tenant, isChatWithPDFProvider } = llmConfig;

    if (!apiKey && provider !== 'ollama' && !isChatWithPDFProvider) {
      throw new Error('API Key is required');
    }

    const vaultResult = await this.saveLLMConfigInVault(
      isChatWithPDFProvider ? { ...llmConfig, apiKey: `chat_with_pdf_${tenant}_key` } : llmConfig
    );
    const config = await this.storeLLMConfig({
      provider: llmConfig.provider,
      baseURL: llmConfig.baseURL || '',
      models: llmConfig.models || [],
      terminusToken: vaultResult || '',
      tenant,
      isChatWithPDFProvider,
    });

    return config;
  }

  private async updateLLMConfigInVault({
    tenant,
    token,
    apiKey,
  }: {
    tenant: string;
    provider: string;
    token: string;
    apiKey?: string;
    baseURL?: string;
  }) {
    await axios.put(
      `${this.opts.terminus?.hostUrl}/v1/vault/${tenant}/${this.opts.terminus?.llm?.product}/data?token=${token}`,
      {
        apiKey,
      },
      {
        headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` },
      }
    );
  }

  public async updateLLMConfig(configId: string, llmConfig: LLMConfigPayload): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const config = await this.llmConfigStore.get(configId);
    if (!config) {
      throw new JacksonError('Config not found', 404);
    }

    const configFromVault = await this.getLLMConfigFromVault(config.tenant, config.terminusToken);
    if (!configFromVault) {
      throw new JacksonError('Config not found in Vault', 404);
    }

    await this.updateLLMConfigInVault({
      token: config.terminusToken,
      tenant: config.tenant,
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey || configFromVault.apiKey,
      baseURL: llmConfig.baseURL,
    });

    await this.llmConfigStore.put(configId, {
      ...config,
      provider: llmConfig.provider,
      models: llmConfig.models || [],
    });
  }

  public async deleteLLMConfig({ configId, tenant }: { configId: string; tenant: string }): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);
    const config = await this.llmConfigStore.get(configId);
    if (!config) {
      throw new JacksonError('Config not found', 404);
    }
    await this.llmConfigStore.delete(configId);
    await axios.delete(
      `${this.opts.terminus?.hostUrl}/v1/vault/${tenant}/${this.opts.terminus?.llm?.product}/data?token=${config.terminusToken}`,
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` } }
    );
  }

  public async getConversationsByTenantAndUser({
    tenant,
    userId,
  }: {
    tenant: string;
    userId: string;
  }): Promise<LLMConversation[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const _index = { name: IndexNames.TenantUser, value: dbutils.keyFromParts(tenant, userId) };

    const conversations = (await this.conversationStore.getByIndex(_index)).data as LLMConversation[];

    return conversations;
  }

  public async getConversationById(conversationId: string): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversation = (await this.conversationStore.get(conversationId)) as LLMConversation;

    return conversation;
  }

  public async createConversation(
    conversation: Omit<LLMConversation, 'id' | 'createdAt'>
  ): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversationID = crypto.randomBytes(20).toString('hex');
    const createdAt = Date.now();

    const _index = {
      name: IndexNames.TenantUser,
      value: dbutils.keyFromParts(conversation.tenant, conversation.userId),
    };

    await this.conversationStore.put(
      conversationID,
      { ...conversation, id: conversationID, createdAt },
      _index
    );

    return { id: conversationID, createdAt, ...conversation };
  }

  public async createChat(chat: Omit<LLMChat, 'id' | 'createdAt'>): Promise<LLMChat> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const chatID = crypto.randomBytes(20).toString('hex');

    const createdAt = Date.now();

    await this.chatStore.put(
      chatID,
      { ...chat, id: chatID, createdAt },
      { name: IndexNames.LLMConversation, value: chat.conversationId }
    );

    return { id: chatID, createdAt, ...chat };
  }

  public async getChatThreadByConversationId(conversationId: string, userId: string): Promise<LLMChat[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversation = await this.getConversationById(conversationId);

    if (userId !== conversation.userId) {
      throw new JacksonError('Forbidden', 403);
    }

    if (!conversation) {
      throw new JacksonError('Conversation not found', 404);
    }

    const chat = (
      await this.chatStore.getByIndex(
        {
          name: IndexNames.LLMConversation,
          value: conversationId,
        },
        undefined,
        undefined,
        undefined,
        'ASC'
      )
    ).data as LLMChat[];

    return chat;
  }

  public async getLLMProviders(tenant: string, filterByTenant?: boolean): Promise<LLMProvidersOptionsType> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (filterByTenant) {
      // Will be used for dropdown while chatting with LLM
      const configs = await this.getLLMConfigsByTenant(tenant);
      return Array.from(
        new Set(
          configs
            .filter(({ isChatWithPDFProvider }) => !isChatWithPDFProvider)
            .map((config) => config.provider)
        )
      )
        .sort()
        .map((provider) => ({
          id: provider,
          name: LLM_PROVIDERS[provider].name,
        }));
    }

    // Will be used for dropdown while creating a new config
    return Object.keys(LLM_PROVIDERS)
      .sort()
      .map((key) => ({
        id: key as LLMProvider,
        name: LLM_PROVIDERS[key].name,
      }));
  }

  public async getLLMModels(
    tenant: string,
    provider: LLMProvider,
    filterByTenant?: boolean // fetch models by saved configs
  ): Promise<LLMModel[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (filterByTenant) {
      // Will be used for dropdown while chatting with LLM
      const configs = await this.getLLMConfigsByTenantAndProvider(tenant, provider);
      if (configs.length === 0) {
        throw new JacksonError('Config not found', 404);
      }
      const modelsFromConfigs = Array.from(new Set(configs.map((c: LLMConfig) => c.models).flat())).filter(
        (m) => Boolean(m)
      );

      if (modelsFromConfigs.length === 0) {
        throw new JacksonError('No models found', 404);
      }

      const models = modelsFromConfigs
        .map((model: string) => LLM_PROVIDERS[provider].models.find((m) => m.id === model)!)
        .filter((m) => m !== undefined);

      return models;
    }

    // Will be used for dropdown while creating a new config
    return LLM_PROVIDERS[provider].models;
  }

  private getUserRole(email: string) {
    const mappings = this.opts.llm?.documentChat?.roleMapping.split(',');
    if (!mappings) {
      throw new JacksonError('Could not find role mappings on server for chatting with PDF', 500);
    }
    const matchedMapping = mappings.find((m) => {
      const [_email] = m.split(':');
      if (email === _email) {
        return true;
      }
    });

    if (!matchedMapping) {
      throw new JacksonError('Insufficient privileges, no role mapped for given user', 403);
    }

    return matchedMapping.split(':')[1];
  }

  public async generateDocumentChatJWT({ email }: { email: string }) {
    if (!this.opts.llm?.documentChat?.jwtSigningKey) {
      throw new JacksonError('Could not load JWT signing keys for chatting with PDF', 500);
    }
    const jwsAlg = 'RS256';
    const signingKey = await loadJWSPrivateKey(this.opts.llm?.documentChat?.jwtSigningKey, jwsAlg);

    const jwt = await new jose.SignJWT({
      role: this.getUserRole(email),
    })
      .setProtectedHeader({ alg: jwsAlg })
      .setIssuer('urn:boxyhq')
      .setAudience('urn:boxyhq')
      .setExpirationTime('3d')
      .sign(signingKey);

    return jwt;
  }
}
