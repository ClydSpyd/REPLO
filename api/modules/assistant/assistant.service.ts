import Anthropic from "@anthropic-ai/sdk";
import { searchExercisesTool, createAnalyzeTrainingPeriodTool, createListSessionsTool } from "./tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Coach, a friendly fitness assistant built into the REPLO workout-tracking app.
Give practical, general fitness and training guidance. Keep answers concise.
You are not a medical professional — do not give medical advice; suggest seeing a professional for injuries or health concerns.`;

/** One turn in the conversation. Mirrors the Anthropic message shape. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Read-only tools available to the coach. Module-level for now — none of these
// need per-user context yet. When we add tools scoped to req.user.id we'll move
// this behind a buildTools(userId) factory.
// const tools = [searchExercisesTool];

const buildTools = (userId: string) => {
  const analyzePeriodTool = createAnalyzeTrainingPeriodTool(userId);
  const listSessionsTool = createListSessionsTool(userId);
  return [listSessionsTool, searchExercisesTool, analyzePeriodTool];
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
    userId: string
  ): Promise<void> {
    console.log(`[assistant] streamChat: req userID ${userId}`);

    const tools = buildTools(userId);

    const runner = client.beta.messages.toolRunner({
      model: "claude-sonnet-5",
      max_tokens: 64000, // streaming: give the model room; timeouts aren't a concern
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools,
      messages,
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
