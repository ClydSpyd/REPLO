import { Router } from "express";
import { chat } from "./assistant.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/assistant/chat
 * Stream a coach reply for the given conversation as Server-Sent Events.
 * Auth required.
 * Payload: { messages: { role: "user" | "assistant", content: string }[] }
 */
router.post("/chat", authMiddleware, chat);

export default router;
