import crypto from 'crypto';
import axios from 'axios';
import type { Storable, JacksonOption, Records } from '../../typings';
import * as dbutils from '../../db/utils';
import { IndexNames } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { LLMChat, LLMConfig, LLMConfigCreatePayload, LLMConversation, PII_POLICY_OPTIONS } from './types';

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

  private async getLLMConfigsFromVault(
    tenant: string,
    token: string
  ): Promise<
    | {
        apiKey: string;
        baseURL: string;
        piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
      }
    | undefined
  > {
    const res = await axios.get(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data?token=${token}`,
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.read}` } }
    );

    if (res.data[token]) {
      return JSON.parse(res.data[token]?.data);
    }
  }

  public async getLLMConfigs(tenant: string): Promise<LLMConfig[]> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const configs = await this.getLLMConfigsByTenant(tenant);
    for (let i = 0; i < configs.length; i++) {
      const data = await this.getLLMConfigsFromVault(tenant, configs[i].terminusToken);
      if (data) {
        configs[i] = {
          ...configs[i],
          baseURL: data.baseURL,
          apiKey: '*'.repeat(data.apiKey.length),
          piiPolicy: data.piiPolicy,
        } as any;
      }
    }
    return configs;
  }

  private async saveLLMConfigInVault({
    tenant,
    apiKey,
    baseURL,
    piiPolicy,
  }: {
    tenant: string;
    apiKey: string;
    baseURL: string;
    piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
  }): Promise<string | undefined> {
    const res = await axios.post(
      `${this.opts.terminus?.host}/v1/vault/${tenant}/${this.opts.llm?.terminusProduct}/data/llm-config`,
      {
        apiKey: apiKey || '',
        baseURL: baseURL || '',
        piiPolicy,
      },
      { headers: { Authorization: `api-key ${this.opts.terminus?.apiKey?.write}` } }
    );

    if (res.data?.token) {
      return res.data.token;
    }
  }

  private async storeLLMConfig(config: Omit<LLMConfig, 'id'>) {
    return await this.llmConfigStore.put(crypto.randomBytes(20).toString('hex'), config);
  }

  public async createLLMConfig(llmConfig: Omit<LLMConfigCreatePayload, 'id'>): Promise<LLMConfig> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!llmConfig.apiKey && llmConfig.provider !== 'ollama') {
      throw new Error('API Key is required');
    }

    const vaultResult = await this.saveLLMConfigInVault(llmConfig);
    const config = await this.storeLLMConfig({
      provider: llmConfig.provider,
      models: llmConfig.models || [],
      terminusToken: vaultResult || '',
      tenant: llmConfig.tenant,
    });

    // recordMetric('llm.config.created');

    return config;
  }

  public async getConversationsByTenantAndUser({
    tenant,
    userId,
  }: {
    tenant?: string;
    userId: string;
  }): Promise<Records<LLMConversation>> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const _index = tenant
      ? { name: IndexNames.TenantUser, value: dbutils.keyFromParts(tenant, userId) }
      : { name: IndexNames.User, value: userId };

    const conversations = (await this.conversationStore.getByIndex(_index)) as Records<LLMConversation>;

    return conversations;
  }

  public async getConversationById(conversationId: string): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversation = (await this.conversationStore.get(conversationId)) as LLMConversation;

    return conversation;
  }

  public async createConversation(conversation: Omit<LLMConversation, 'id'>): Promise<LLMConversation> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversationID = crypto.randomBytes(20).toString('hex');

    const _index = conversation.tenant
      ? {
          name: IndexNames.TenantUser,
          value: dbutils.keyFromParts(conversation.tenant, conversation.userId),
        }
      : { name: IndexNames.User, value: conversation.userId };

    await this.conversationStore.put(conversationID, conversation, _index);

    return { id: conversationID, ...conversation };
  }

  public async createChat(chat: Omit<LLMChat, 'id'>): Promise<LLMChat> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const chatID = crypto.randomBytes(20).toString('hex');

    await this.chatStore.put(chatID, chat);

    return { id: chatID, ...chat };
  }
}
