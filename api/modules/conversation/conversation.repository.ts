import mongoose from "mongoose";
import { ConversationModel } from "./conversation.model";
import { ConversationMessage } from "./conversation.types";

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

  /** Atomic append + touch — no read-modify-write, so concurrent turns can't clobber. */
  async appendMessage(conversationId: string, message: ConversationMessage) {
    return ConversationModel.findByIdAndUpdate(
      conversationId,
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
   * trip. Messages come back oldest→newest within the page.
   */
  async getPage(conversationId: string, offset: number, limit: number) {
    const [result] = await ConversationModel.aggregate<{
      total: number;
      messages: ConversationMessage[];
    }>([
      { $match: { _id: new mongoose.Types.ObjectId(conversationId) } },
      {
        $project: {
          total: { $size: "$messages" },
          messages: {
            $slice: [
              "$messages",
              {
                $max: [
                  { $subtract: [{ $size: "$messages" }, offset + limit] },
                  0,
                ],
              },
              limit,
            ],
          },
        },
      },
    ]);
    return result ?? { total: 0, messages: [] };
  }
}
