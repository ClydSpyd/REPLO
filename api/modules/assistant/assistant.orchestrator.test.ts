import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantOrchestrator } from "./assistant.orchestrator";
import { ConversationService } from "../conversation/conversation.service";
import { AssistantService } from "./assistant.service";
import { RoutineProposal } from "./tools";

vi.mock("../conversation/conversation.service");
vi.mock("./assistant.service");

describe("AssistantOrchestrator", () => {
  let conversationService!: ConversationService;
  let assistantService!: AssistantService;
  let orchestrator!: AssistantOrchestrator;

  beforeEach(() => {
    vi.resetAllMocks();

    conversationService = new ConversationService();
    assistantService = new AssistantService();

    orchestrator = new AssistantOrchestrator(
      conversationService,
      assistantService,
    );

    vi.mocked(assistantService.streamChat).mockResolvedValue(undefined);

    vi.mocked(conversationService.appendAssistantMessage).mockResolvedValue(
      undefined,
    );

    vi.mocked(conversationService.appendUserMessage).mockResolvedValue(
      "conversation-123",
    );

    vi.mocked(conversationService.getPageById).mockResolvedValue({
      conversationId: "conversation-123",
      messages: [
        {
          role: "user",
          content: "Build me a workout routine",
        },
      ],
      total: 1,
      hasMore: false,
    });

    vi.mocked(conversationService.getSummary).mockResolvedValue({
      total: 1,
      summary: "The user prefers strength training.",
    });

    vi.mocked(conversationService.appendProposal).mockResolvedValueOnce(
      "proposal-123",
    );
  });

  it("persists the user message before retrieving context", async () => {
    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken: vi.fn(),
        onProposal: vi.fn(),
      },
    );
    expect(conversationService.appendUserMessage).toHaveBeenCalledWith(
      "user-123",
      "Build me a workout routine",
    );

    const appendOrder = vi.mocked(conversationService.appendUserMessage).mock
      .invocationCallOrder[0];

    const retrievalOrder = vi.mocked(conversationService.getPageById).mock
      .invocationCallOrder[0];

    expect(appendOrder).toBeLessThan(retrievalOrder);
  });

  it("retrieves context for the correct conversation", async () => {
    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken: vi.fn(),
        onProposal: vi.fn(),
      },
    );

    expect(conversationService.getSummary).toHaveBeenCalledWith(
      "user-123",
      "conversation-123"
    );
  });

  it("passes the assembled model context to AssistantService", async () => {
    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken: vi.fn(),
        onProposal: vi.fn(),
      },
    );
    const [modelContext] = vi.mocked(assistantService.streamChat).mock.calls[0];

    expect(modelContext.system).toContain("CORE INSTRUCTIONS:");
    expect(modelContext.system).toContain("You are Coach");
    expect(modelContext.system).toContain(
      "The user prefers strength training.",
    );

    expect(modelContext.messages).toEqual([
      {
        role: "user",
        content: "Build me a workout routine",
      },
    ]);
  });

  it("forwards streamed tokens to the caller", async () => {
    const onToken = vi.fn();

    // The mocked model streams one token through the callback it is given.
    vi.mocked(assistantService.streamChat).mockImplementationOnce(
      async (_context, emitToken) => {
        emitToken("Hello");
      },
    );

    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken,
        onProposal: vi.fn(),
      },
    );

    expect(onToken).toHaveBeenCalledWith("Hello");
  });

  it("persists the accumulated assistant response", async () => {
    vi.mocked(assistantService.streamChat).mockImplementationOnce(
      async (_context, emitToken) => {
        emitToken("Hello");
        emitToken("World");
      },
    );

    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken: vi.fn(),
        onProposal: vi.fn(),
      },
    );

    expect(conversationService.appendAssistantMessage).toHaveBeenCalledWith(
      "user-123",
      "conversation-123",
      "HelloWorld",
    );

    expect(conversationService.appendAssistantMessage).toHaveBeenCalledTimes(1);
  });

  it("persists routine proposals before emitting them", async () => {
    const onProposal = vi.fn();

    vi.mocked(assistantService.streamChat).mockImplementationOnce(
      async (_context, _emitToken, emitProposal) => {
        await emitProposal({} as RoutineProposal);
      },
    );

    await orchestrator.handleIncomingMessage(
      "Build me a workout routine",
      "user-123",
      {
        onToken: vi.fn(),
        onProposal,
      },
    );

    const persistOrder = vi.mocked(conversationService.appendProposal).mock
      .invocationCallOrder[0];

    const emitOrder = vi.mocked(onProposal).mock.invocationCallOrder[0];

    expect(persistOrder).toBeLessThan(emitOrder);

    expect(conversationService.appendProposal).toHaveBeenCalledWith(
      "user-123",
      "conversation-123",
      {},
    );

    expect(onProposal).toHaveBeenCalledWith({
      proposalId: "proposal-123",
    });
  });

  it("propagates model execution failures", async () => {
    vi.mocked(assistantService.streamChat).mockRejectedValueOnce(
      new Error("Model execution failed"),
    );

    await expect(
      orchestrator.handleIncomingMessage(
        "Build me a workout routine",
        "user-123",
        {
          onToken: vi.fn(),
          onProposal: vi.fn(),
        },
      ),
    ).rejects.toThrow("Model execution failed");

    expect(conversationService.appendAssistantMessage).not.toHaveBeenCalled();
  });

  it("does not invoke the model if user persistence fails", async () => {
    vi.mocked(conversationService.appendUserMessage).mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    await expect(
      orchestrator.handleIncomingMessage(
        "Build me a workout routine",
        "user-123",
        {
          onToken: vi.fn(),
          onProposal: vi.fn(),
        },
      ),
    ).rejects.toThrow("Database unavailable");

    expect(conversationService.getPageById).not.toHaveBeenCalled();
    expect(conversationService.getSummary).not.toHaveBeenCalled();
    expect(assistantService.streamChat).not.toHaveBeenCalled();
    expect(conversationService.appendAssistantMessage).not.toHaveBeenCalled();
  });
});
