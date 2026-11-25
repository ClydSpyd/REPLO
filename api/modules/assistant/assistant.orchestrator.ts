import { ConversationService } from "../conversation/conversation.service";
import { ProposalPayload } from "../conversation/conversation.types";
import { AssistantService } from "./assistant.service";
import { buildContext } from "./context/context-builder";
import { CONTEXT_CONFIG } from "./context/context.config";
import { mapConversationMessages } from "./context/conversation-message-mapper";
import { SummarisationService } from "./context/summarisation.service";

const SYSTEM_PROMPT = `You are Coach, a friendly fitness assistant built into the REPLO workout-tracking app.
Give practical, general fitness and training guidance. Keep answers concise.
You are not a medical professional — do not give medical advice; suggest seeing a professional for injuries or health concerns.
When the user wants to build, create, or save a routine, call propose_routine to present it as a confirmation card — never create a routine silently. Resolve exercise slugs via search_exercises first. After proposing, briefly tell the user to tap "Add routine" to save it.`;

interface AssistantCallbacks {
  onToken: (text: string) => void;
  onProposal: (proposal: ProposalPayload & { proposalId: string }) => void;
}

export class AssistantOrchestrator {
  constructor(
    private conversationService: ConversationService,
    private assistantService: AssistantService,
    private summarisationService: SummarisationService,
  ) {}

  async handleIncomingMessage(
    message: string,
    userId: string,
    send: AssistantCallbacks,
  ) {
    // persist incoming message to convo history
    const conversationId = await this.conversationService.appendUserMessage(
      userId,
      message,
    );

    // check if summarisation + memory extraction is required, execute if so
    await this.summarisationService.maybeSummarise(userId, conversationId);

    // retreive unsummarised messages, summary and memory data
    const { summary, total, summarisedMessageCount } =
      await this.conversationService.getSummary(userId, conversationId);

    const messages = await this.conversationService.getMessagesByIndexRange(
      userId,
      conversationId,
      summarisedMessageCount,
      total,
    );

    // build ModelContext payload
    const modelContext = buildContext({
      systemInstructions: [SYSTEM_PROMPT],
      userMemory: [],
      recentMessages: mapConversationMessages(messages),
      summary,
    });

    // stream assistant response to client via SSE
    let assistantText = "";
    await this.assistantService.streamChat(
      modelContext,
      (text) => {
        assistantText += text;
        send.onToken(text);
      },
      async (proposal) => {
        const proposalId = await this.conversationService.appendProposal(
          userId,
          conversationId,
          proposal,
        );
        send.onProposal({ proposalId, ...proposal });
      },
      userId,
    );

    // persist assistant response
    await this.conversationService.appendAssistantMessage(
      userId,
      conversationId,
      assistantText,
    );
  }
}
