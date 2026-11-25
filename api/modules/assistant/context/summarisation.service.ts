import { ConversationService } from "../../conversation/conversation.service";
import { AssistantService } from "../assistant.service";
import { CONTEXT_CONFIG } from "./context.config";

export class SummarisationService {
  constructor(
    private conversationService: ConversationService,
    private assistantService: AssistantService,
  ) {}

  async maybeSummarise(userId: string, conversationId: string) {
    try {
      // retrieve existing summary
      const conversation = await this.conversationService.getSummary(
        userId,
        conversationId,
      );
      if (!conversation) {
        return;
      }

      const totalMessages = conversation.total;
      const summarisedMessageCount = conversation.summarisedMessageCount;

      const eligibleMessageCount =
        totalMessages -
        summarisedMessageCount -
        CONTEXT_CONFIG.RECENT_WINDOW_SIZE;

      if (eligibleMessageCount < CONTEXT_CONFIG.SUMMARY_BATCH_SIZE) {
        return;
      }

      const messagesToSummarise =
        await this.conversationService.getMessagesByIndexRange(
          userId,
          conversationId,
          summarisedMessageCount,
          totalMessages - CONTEXT_CONFIG.RECENT_WINDOW_SIZE,
        );
      if (messagesToSummarise.length === 0) {
        return;
      }

      console.log(
        `[summarisation] messages to summarise: ${messagesToSummarise.length}`,
      );

      const updatedSummary = await this.assistantService.summariseConversation(
        conversation.summary,
        messagesToSummarise,
      );

      if (!updatedSummary.trim()) {
        throw new Error("LLM returned an empty summary");
      }

      console.log(`[summarisation] updated summary: ${updatedSummary}`);

      console.log("[summarisation] Completed", {
        conversationId,
        messagesSummarised: messagesToSummarise.length,
        previousCheckpoint: summarisedMessageCount,
        newCheckpoint: summarisedMessageCount + messagesToSummarise.length,
      });

      // update the conversation summary in your database
      // increment the summarisedMessageCount accordingly.
      await this.conversationService.updateSummary(
        userId,
        conversationId,
        updatedSummary,
        summarisedMessageCount + messagesToSummarise.length,
      );
    } catch (error) {
      console.error("[summarisation] failed to summarise conversation:", error);
    }
  }
}
