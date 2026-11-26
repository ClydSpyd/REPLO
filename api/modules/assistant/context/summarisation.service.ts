import { ConversationService } from "../../conversation/conversation.service";
import { AssistantService } from "../assistant.service";
import { CONTEXT_CONFIG } from "./context.config";
import { mapConversationMessages } from "./conversation-message-mapper";

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

      // determine messages eligible for summarisation
      const totalMessages = conversation.total;
      const summarisedMessageCount = conversation.summarisedMessageCount;
      
      const eligibleMessageCount =
        totalMessages -
        summarisedMessageCount -
        CONTEXT_CONFIG.RECENT_WINDOW_SIZE;

      const batchSize = Math.min(
        eligibleMessageCount,
        CONTEXT_CONFIG.MAXIMUM_BATCH_SIZE,
      );

      // skip summarisation if not enough eligible messages
      if (eligibleMessageCount < CONTEXT_CONFIG.SUMMARY_BATCH_SIZE) {
        return;
      }

      // extract messages to summarise by index range
      const messagesToSummarise =
        await this.conversationService.getMessagesByIndexRange(
          userId,
          conversationId,
          summarisedMessageCount,
          summarisedMessageCount + batchSize,
        );

      if (messagesToSummarise.length === 0) {
        return;
      }

      console.log(
        `[summarisation] messages to summarise: ${messagesToSummarise.length}`,
      );

      // generate updated summary using assistant service
      const updatedSummary = await this.assistantService.summariseConversation(
        conversation.summary,
        mapConversationMessages(messagesToSummarise),
      );

      if (!updatedSummary.trim()) {
        throw new Error("LLM returned an empty summary");
      }

      // update conversation summary in DB, increment summarisedMessageCount
      await this.conversationService.updateSummary(
        userId,
        conversationId,
        updatedSummary,
        summarisedMessageCount + messagesToSummarise.length,
      );

      console.log("[summarisation] Completed", {
        conversationId,
        messagesSummarised: messagesToSummarise.length,
        previousCheckpoint: summarisedMessageCount,
        newCheckpoint: summarisedMessageCount + messagesToSummarise.length,
      });
    } catch (error) {
      console.error("[summarisation] failed to summarise conversation:", error);
    }
  }
}
