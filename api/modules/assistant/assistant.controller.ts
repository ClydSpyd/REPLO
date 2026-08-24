/**
 * Assistant Controller
 * HTTP + SSE plumbing for coach chat
 *
 * SSE event protocol (server -> client):
 *   token  { text }   one text delta
 *   done   {}         reply complete
 *   error  { message} something went wrong
 */
import { Request, Response, NextFunction } from "express";
import { AssistantService, ChatMessage } from "./assistant.service";
import { ConversationService } from "../conversation/conversation.service";
import { AuthenticatedRequest } from "../../types/auth";

const service = new AssistantService();
const conversations = new ConversationService();

export async function chat(req: Request, res: Response) {
  const { messages } = req.body as {
    messages?: ChatMessage[];
  };
  
  const { user } = req as AuthenticatedRequest;

  // Basic validation before we commit to an SSE response — once headers are
  // flushed we can no longer send a normal JSON error.
  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ error: "messages must be a non-empty array" });
  }

  // SSE headers. `X-Accel-Buffering: no` + no compression on this route keeps
  // proxies (e.g. Render) from buffering the stream.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Persist the user turn up front so it survives a mid-stream disconnect.
    const lastUser = messages[messages.length - 1];
    const conversationId = await conversations.appendUserMessage(
      user.id,
      lastUser.content,
    );

    console.log(`[assistant] streamChat: req userID ${user.id} conversationID ${conversationId}`);
    console.log(`[assistant] streamChat: messages ${JSON.stringify(messages)}`);

    // Accumulate the streamed reply so we can persist the full assistant turn.
    let assistantText = "";
    await service.streamChat(
      messages,
      (text) => {
        assistantText += text;
        send("token", { text });
      },
      user.id,
    );

    console.log(`[assistant] streamChat: ÖÖÖÖ userID ${user.id} conversationID ${conversationId}`);

    await conversations.appendAssistantMessage(conversationId, assistantText);
    send("done", {});
  } catch (err) {
    // Headers are already sent, so report the error inside the stream rather
    // than handing off to the global error handler.
    const message = err instanceof Error ? err.message : "Unknown error";
    send("error", { message });
  } finally {
    res.end();
  }
}
