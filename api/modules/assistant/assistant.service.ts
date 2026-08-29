import Anthropic from "@anthropic-ai/sdk";
import { searchExercisesTool, createAnalyzeTrainingPeriodTool, createListSessionsTool, createProposeRoutineTool, RoutineProposal, createReadRoutinesTool } from "./tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Coach, a friendly fitness assistant built into the REPLO workout-tracking app.
Give practical, general fitness and training guidance. Keep answers concise.
You are not a medical professional — do not give medical advice; suggest seeing a professional for injuries or health concerns.
When the user wants to build, create, or save a routine, call propose_routine to present it as a confirmation card — never create a routine silently. Resolve exercise slugs via search_exercises first. After proposing, briefly tell the user to tap "Add routine" to save it.`;

/** One turn in the conversation. Mirrors the Anthropic message shape. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function toModelMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
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

export class AssistantService {
  /**
   * Stream a reply for the given conversation. The tool-runner drives the whole
   * agentic loop (call model → run any tool → repeat); `onToken` receives each
   * text delta. Resolves when the reply is complete (rejects on API error).
   */
  async streamChat(
    messages: ChatMessage[],
    onToken: (text: string) => void,
    emitProposal: (proposal: RoutineProposal) => void | Promise<void>,
    userId: string
  ): Promise<void> {
    console.log(`[assistant] streamChat: req userID ${userId}`);

    const tools = buildTools(userId, emitProposal);
    const modelMessages = toModelMessages(messages);

    const runner = client.beta.messages.toolRunner({
      model: "claude-sonnet-5",
      max_tokens: 64000, // streaming: give the model room; timeouts aren't a concern
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools,
      messages: modelMessages,
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
