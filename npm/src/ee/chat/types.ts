export type LLMConversation = {
  id: string;
  teamId?: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
};

export type LLMChat = {
  id: string;
  conversationId: string;
  content: string;
  role: string;
};

export type LLMConfig = {
  id: string;
  provider: string;
  models: string[];
  terminusToken: string;
  teamId: string;
};
