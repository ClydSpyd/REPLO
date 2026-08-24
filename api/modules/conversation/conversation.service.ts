import { ConversationRepository } from "./conversation.repository";
import { MessagePage } from "./conversation.types";

export class ConversationService {
  private repository = new ConversationRepository();

  /** The user's active conversation, creating an empty one if none exists. */
  async getOrCreateActive(userId: string) {
    const existing = await this.repository.findActiveByUser(userId);
    return existing ?? (await this.repository.create(userId));
  }

  /** Persist a user turn, returning the conversation it landed in. */
  async appendUserMessage(userId: string, content: string): Promise<string> {
    const conversation = await this.getOrCreateActive(userId);
    const id = String(conversation._id);
    await this.repository.appendMessage(id, { role: "user", content });
    return id;
  }

  async appendAssistantMessage(conversationId: string, content: string) {
    await this.repository.appendMessage(conversationId, {
      role: "assistant",
      content,
    });
  }

  /**
   * A page of the user's active conversation, counted from the newest end.
   * Returns an empty page if the user has never chatted.
   */
  async getPage(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<MessagePage> {
    const active = await this.repository.findActiveByUser(userId);
    if (!active) {
      return { conversationId: null, messages: [], total: 0, hasMore: false };
    }
    const id = String(active._id);
    const { total, messages } = await this.repository.getPage(
      id,
      offset,
      limit,
    );
    return {
      conversationId: id,
      messages,
      total,
      hasMore: offset + messages.length < total,
    };
  }
}
