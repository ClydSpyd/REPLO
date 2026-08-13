/**
 * Assistant Service
 * Wraps the Claude API. This is the ONLY module that talks to Anthropic —
 * routes/controllers stay ignorant of the model, streaming shape, etc.
 */
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from .env
const client = new Anthropic();

const SYSTEM_PROMPT = `You are Coach, a friendly fitness assistant built into the REPLO workout-tracking app.
Give practical, general fitness and training guidance. Keep answers concise.
You are not a medical professional — do not give medical advice; suggest seeing a professional for injuries or health concerns.`;

/** One turn in the conversation. Mirrors the Anthropic message shape */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class AssistantService {
  /**
   * Stream a reply for the given conversation. `onToken` is invoked with each
   * text delta as it arrives; the returned promise resolves when the reply is
   * complete (or rejects if the API errors).
   */
  async streamChat(
    messages: ChatMessage[],
    onToken: (text: string) => void,
  ): Promise<void> {
    const stream = client.messages.stream({
      model: "claude-sonnet-5",
      max_tokens: 64000, // streaming: give the model room; timeouts aren't a concern
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages,
    });

    // `text` fires with just the incremental string — simpler than filtering
    // raw content_block_delta events ourselves.
    stream.on("text", (delta) => onToken(delta));

    // Resolves when the whole response is done; surfaces any API error as a throw.
    await stream.finalMessage();
  }
}
