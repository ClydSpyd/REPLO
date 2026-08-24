/** One stored turn in a conversation. Mirrors the assistant wire shape. */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

/** A page of messages counted from the newest end of the conversation. */
export interface MessagePage {
  conversationId: string | null;
  messages: ConversationMessage[];
  total: number;
  hasMore: boolean;
}
