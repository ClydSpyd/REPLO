/**
 * Assistant Controller
 * HTTP + SSE plumbing for coach chat
 *
 * SSE event protocol (server -> client):
 *   token    { text }      one text delta
 *   proposal { routine }   a routine proposed for the user to confirm
 *   done     {}            reply complete
 *   error    { message}    something went wrong
 */
import { Request, Response } from "express";
import { AssistantService, ChatMessage } from "./assistant.service";
import { ConversationService } from "../conversation/conversation.service";
import { AuthenticatedRequest } from "../../types/auth";
import { AssistantOrchestrator } from "./assistant.orchestrator";

const service = new AssistantService();
const conversations = new ConversationService();
const orchestrator = new AssistantOrchestrator(conversations, service);

export async function chat(req: Request, res: Response) {
  const { message } = req.body as {
    message?: ChatMessage;
  };

  const { user } = req as AuthenticatedRequest;

  // Basic validation before we commit to an SSE response — once headers are
  // flushed we can no longer send a normal JSON error.
  if (!message) {
    return res.status(400).json({ error: "message is required" });
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
    await orchestrator.handleIncomingMessage(message.content, user.id, {
      onToken: (text) => {
        send("token", { text });
      },
      onProposal: (proposal) => {
        send("proposal", proposal);
      },
    });
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
