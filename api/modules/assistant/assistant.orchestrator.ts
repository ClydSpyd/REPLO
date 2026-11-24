import { ConversationService } from "../conversation/conversation.service";
import { ProposalPayload } from "../conversation/conversation.types";
import { AssistantService } from "./assistant.service";
import { buildContext } from "./context/context-builder";
import { mapConversationMessages } from "./context/conversation-message-mapper";

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

    // check if summarisation + memory extraction is required, execute if so [[ implementation deferred to next step ]]

    // retreive last 10 messages, summary and memory data
    const { messages } = await this.conversationService.getPage(userId, 0, 10);
    const { summary } =
      await this.conversationService.getSummary(conversationId);

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
          conversationId,
          proposal,
        );
        send.onProposal({ proposalId, ...proposal });
      },
      userId,
    );

    // persist assistant response
    await this.conversationService.appendAssistantMessage(
      conversationId,
      assistantText,
    );
  }
}
