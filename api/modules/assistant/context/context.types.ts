import { ChatMessage } from "../assistant.service";

export interface ContextBuilderInput {
  systemInstructions: string[];
  userMemory: string[];
  summary?: string;
  recentMessages: ChatMessage[];
}

export interface ModelContext {
  system: string;
  messages: ChatMessage[];
}
