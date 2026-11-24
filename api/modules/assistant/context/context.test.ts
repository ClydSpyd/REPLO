import { describe, it, expect } from "vitest";
import { ChatMessage } from "../assistant.service";
import { ContextBuilderInput, ModelContext } from "./context.types";
import { buildContext } from "./context-builder";

const mockMessages: ChatMessage[] = [
  {
    role: "user",
    content: "Hello",
  },
  {
    role: "assistant",
    content: "Hi there!",
  },
];

const mockSystemInstructions: string[] = ["You are a helpful assistant."];

const mockUserMemory: string[] = ["User prefers concise answers."];

const mockSummary = "User prefers concise answers.";

describe("ContextBuilder", () => {
  it("Returns full ModelContext when provided complete input", () => {
    const input: ContextBuilderInput = {
      systemInstructions: mockSystemInstructions,
      recentMessages: mockMessages,
      userMemory: mockUserMemory,
      summary: mockSummary,
    };
    const modelContext: ModelContext = buildContext(input);
    expect(modelContext.messages).toHaveLength(mockMessages.length);
    expect(modelContext.system).toContain("CORE INSTRUCTIONS");
    expect(modelContext.system).toContain("USER MEMORY");
    expect(modelContext.system).toContain("CONVERSATION SUMMARY");
    expect(modelContext.system).toContain(mockSystemInstructions[0]);
    expect(modelContext.system).toContain(mockUserMemory[0]);
    expect(modelContext.system).toContain(mockSummary);
  });

  it("Returns partial ModelContext when provided incomplete input", () => {
    const input: ContextBuilderInput = {
      systemInstructions: mockSystemInstructions,
      recentMessages: mockMessages,
      userMemory: [],
    };
    const modelContext: ModelContext = buildContext(input);
    expect(modelContext.messages).toHaveLength(mockMessages.length);
    expect(modelContext.system).toContain("CORE INSTRUCTIONS");
    expect(modelContext.system).not.toContain("USER MEMORY");
    expect(modelContext.system).not.toContain("CONVERSATION SUMMARY");
  });

  it("Provides the exact messages in the ModelContext", () => {
    const input: ContextBuilderInput = {
      systemInstructions: mockSystemInstructions,
      recentMessages: mockMessages,
      userMemory: mockUserMemory,
      summary: mockSummary,
    };
    const modelContext: ModelContext = buildContext(input);
    expect(modelContext.messages).toEqual(mockMessages);
  });
});
