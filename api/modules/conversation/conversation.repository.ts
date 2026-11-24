import mongoose from "mongoose";
import { ConversationModel } from "./conversation.model";
import { ConversationMessage } from "./conversation.types";

// Aggregate doesn't auto-cast ids like find() does, so cast explicitly.
const ownedBy = (userId: string, conversationId: string) => ({
  _id: new mongoose.Types.ObjectId(conversationId),
  userId: new mongoose.Types.ObjectId(userId),
});

export class ConversationRepository {
  /** The user's active (most-recently touched) conversation, or null. */
  async findActiveByUser(userId: string) {
    return ConversationModel.findOne({ userId })
      .sort({ lastActiveAt: -1 })
      .exec();
  }

  async create(userId: string) {
    return ConversationModel.create({ userId, messages: [] });
  }

  /**
   * Atomic append + touch — no read-modify-write, so concurrent turns can't
   * clobber. Scoped by owner: returns null if the conversation isn't the user's.
   */
  async appendMessage(
    userId: string,
    conversationId: string,
    message: ConversationMessage,
  ) {
    return ConversationModel.findOneAndUpdate(
      { _id: conversationId, userId },
      { $push: { messages: message }, $set: { lastActiveAt: new Date() } },
      { new: true },
    );
  }

  /**
   * Update a proposal turn's status in place, scoped by owner. Positional
   * `$` targets the matched proposalId. Returns null if not found/not owned.
   */
  async setProposalStatus(
    userId: string,
    proposalId: string,
    status: string,
    routineId?: string,
  ) {
    return ConversationModel.findOneAndUpdate(
      { userId, "messages.proposalId": proposalId },
      {
        $set: {
          "messages.$.status": status,
          ...(routineId ? { "messages.$.routineId": routineId } : {}),
        },
      },
      { new: true },
    );
  }

  /**
   * A page of `limit` messages ending `offset` messages back from the newest.
   * `start` is derived from the array size inside the pipeline so it's one round
   * trip. Messages come back oldest→newest within the page. Scoped by owner:
   * a conversation that isn't the user's returns null.
   */
  async fetchPage(
    userId: string,
    conversationId: string,
    offset: number,
    limit: number,
  ) {
    const [result] = await ConversationModel.aggregate<{
      total: number;
      messages: ConversationMessage[];
    }>([
      { $match: ownedBy(userId, conversationId) },
      {
        $project: {
          total: { $size: "$messages" },
          messages: {
            // Window is [end - limit, end) where end = size - offset, so the
            // oldest partial page is shortened rather than overlapping the
            // previous one. $slice rejects a count of 0, hence the $cond.
            $let: {
              vars: {
                end: {
                  $max: [{ $subtract: [{ $size: "$messages" }, offset] }, 0],
                },
              },
              in: {
                $let: {
                  vars: {
                    start: { $max: [{ $subtract: ["$$end", limit] }, 0] },
                  },
                  in: {
                    $cond: [
                      { $gt: ["$$end", "$$start"] },
                      {
                        $slice: [
                          "$messages",
                          "$$start",
                          { $subtract: ["$$end", "$$start"] },
                        ],
                      },
                      [],
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ]);
    return result ?? null;
  }

  /** Summary of one conversation, scoped by owner. */
  async getSummary(
    userId: string,
    conversationId: string,
  ): Promise<{ total: number; summary: string }> {
    const [result] = await ConversationModel.aggregate<{
      total: number;
      summary: string;
    }>([
      { $match: ownedBy(userId, conversationId) },
      {
        $project: {
          total: { $size: "$messages" },
          summary: "$summary",
        },
      },
    ]);
    return result ?? { total: 0, summary: "" };
  }
}
