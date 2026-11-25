import { randomUUID } from "crypto";
import { ConversationRepository } from "./conversation.repository";
import { ConversationMessage, MessagePage, ProposalPayload, ProposalStatus } from "./conversation.types";

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
    await this.append(userId, id, { role: "user", content });
    return id;
  }

  async appendAssistantMessage(
    userId: string,
    conversationId: string,
    content: string,
  ) {
    await this.append(userId, conversationId, { role: "assistant", content });
  }

  /** Persist a proposed routine as a pending proposal turn; returns its id. */
  async appendProposal(
    userId: string,
    conversationId: string,
    proposal: ProposalPayload,
  ): Promise<string> {
    const proposalId = randomUUID();
    await this.append(userId, conversationId, {
      role: "assistant",
      content: "",
      proposalId,
      proposal,
      status: "pending",
    });
    return proposalId;
  }

  /** Owner-scoped append; throws rather than silently dropping a turn. */
  private async append(
    userId: string,
    conversationId: string,
    message: ConversationMessage,
  ) {
    const updated = await this.repository.appendMessage(
      userId,
      conversationId,
      message,
    );
    if (!updated) {
      throw new Error("Conversation not found for user");
    }
  }

  /** Record a proposal's outcome (accepted/dismissed), scoped by owner. */
  async setProposalStatus(
    userId: string,
    proposalId: string,
    status: ProposalStatus,
    routineId?: string,
  ): Promise<boolean> {
    const updated = await this.repository.setProposalStatus(
      userId,
      proposalId,
      status,
      routineId,
    );
    return updated !== null;
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
    return this.getPageById(userId, String(active._id), offset, limit);
  }

  /**
   * A page of a specific conversation, counted from the newest end. Empty if
   * the conversation doesn't exist or isn't owned by `userId`.
   */
  async getPageById(
    userId: string,
    conversationId: string,
    offset: number,
    limit: number,
  ): Promise<MessagePage> {
    const page = await this.repository.fetchPage(
      userId,
      conversationId,
      offset,
      limit,
    );
    if (!page) {
      return { conversationId: null, messages: [], total: 0, hasMore: false };
    }
    return {
      conversationId,
      messages: page.messages,
      total: page.total,
      hasMore: offset + page.messages.length < page.total,
    };
  }

  /** Summary of a specific conversation; empty if missing or not owned. */
  async getSummary(
    userId: string,
    conversationId: string,
  ): Promise<{
    total: number;
    summary: string;
    summarisedMessageCount: number;
  }> {
    return this.repository.getSummary(userId, conversationId);
  }

  async getMessagesByIndexRange(
  userId: string,
  conversationId: string,
  startIndex: number,
  endIndex: number,
): Promise<ConversationMessage[]> {
    return this.repository.getMessagesByIndexRange(
      userId,
      conversationId,
      startIndex,
      endIndex,
    );
  } 

  async updateSummary(
    userId: string,
    conversationId: string,
    summary: string,
    summarisedMessageCount: number,
  ): Promise<void> {
    await this.repository.updateSummary(
      userId,
      conversationId,
      summary,
      summarisedMessageCount,
    );
  }
}
