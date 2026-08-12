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

const service = new AssistantService();

export async function chat(req: Request, res: Response, next: NextFunction) {
  const { messages } = req.body as { messages?: ChatMessage[] };

  // Basic validation before we commit to an SSE response — once headers are
  // flushed we can no longer send a normal JSON error.
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
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
    await service.streamChat(messages, (text) => send("token", { text }));
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
