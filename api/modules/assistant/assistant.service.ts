import Anthropic from "@anthropic-ai/sdk";
import { searchExercisesTool, createAnalyzeTrainingPeriodTool, createListSessionsTool, createProposeRoutineTool, RoutineProposal, createReadRoutinesTool } from "./tools";
import { ModelContext } from "./context/context.types";

const client = new Anthropic();

/** One turn in the conversation. Mirrors the Anthropic message shape. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const buildTools = (
  userId: string,
  emitProposal: (proposal: RoutineProposal) => void | Promise<void>,
) => {
  const analyzePeriodTool = createAnalyzeTrainingPeriodTool(userId);
  const listSessionsTool = createListSessionsTool(userId);
  const proposeRoutineTool = createProposeRoutineTool(emitProposal);
  const readRoutinesTool = createReadRoutinesTool(userId);
  return [
    listSessionsTool,
    searchExercisesTool,
    analyzePeriodTool,
    proposeRoutineTool,
    readRoutinesTool,
  ];
}

function toModelMessages(messages: ChatMessage[]): ChatMessage[] {
  // Mongo entries also carry createdAt, which is rejected by the toolRunner
  return messages.map(({ role, content }) => ({ role, content }));
}

export class AssistantService {
  /**
   * Stream a reply for the given conversation. The tool-runner drives the whole
   * agentic loop (call model → run any tool → repeat); `onToken` receives each
   * text delta. Resolves when the reply is complete (rejects on API error).
   */
  async streamChat(
    modelContext: ModelContext,
    onToken: (text: string) => void,
    emitProposal: (proposal: RoutineProposal) => void | Promise<void>,
    userId: string
  ): Promise<void> {
    console.log(`[assistant] streamChat: req userID ${userId}`);

    const tools = buildTools(userId, emitProposal);

    const runner = client.beta.messages.toolRunner({
      model: "claude-sonnet-5",
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: modelContext.system,
      tools,
      messages: toModelMessages(modelContext.messages),
      stream: true,
    });

    // With stream: true the runner yields one message-stream per loop iteration.
    // Forward text deltas only — thinking and tool-input deltas stay internal.
    for await (const messageStream of runner) {
      for await (const event of messageStream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          onToken(event.delta.text);
        }
      }
    }
  }
}
