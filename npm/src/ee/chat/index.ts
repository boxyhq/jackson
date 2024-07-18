// import { JacksonError } from '../../controller/error';
import { throwIfInvalidLicense } from '../common/checkLicense';
import type { Storable, JacksonOption, Records } from '../../typings';
import { LLMConversation } from './types';
import { IndexNames } from '../../controller/utils';
import * as dbutils from '../../db/utils';

export class ChatController {
  // private chatStore: Storable;
  // private configStore: Storable;
  private conversationStore: Storable;
  private opts: JacksonOption;

  constructor({ conversationStore, opts }: { conversationStore: Storable; opts: JacksonOption }) {
    this.conversationStore = conversationStore;
    this.opts = opts;
  }

  public async getConversations(): Promise<Records<LLMConversation>> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversations = (await this.conversationStore.getAll()) as Records<LLMConversation>;

    return conversations;
  }

  public async getConversationsByTeamAndUser(
    teamId: string,
    userId: string
  ): Promise<Records<LLMConversation>> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const conversations = (await this.conversationStore.getByIndex({
      name: IndexNames.TeamUser,
      value: dbutils.keyFromParts(teamId, userId),
    })) as Records<LLMConversation>;

    return conversations;
  }
}
