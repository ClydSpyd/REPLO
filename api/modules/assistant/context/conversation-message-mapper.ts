import {
  ConversationMessage,
  ProposalPayload,
} from "../../conversation/conversation.types";
import { ChatMessage } from "../assistant.service";

export function mapConversationMessages(
  messages: ConversationMessage[],
): ChatMessage[] {
  return messages.flatMap((message): ChatMessage[] => {
    // routine proposal messages
    if (message.proposal) {
      return [
        {
          role: "assistant",
          content: formatProposal(message.proposal),
        },
      ];
    }

    // user / assistant messages
    if (message.content?.trim()) {
      return [
        {
          role: message.role,
          content: message.content,
        },
      ];
    }

    // Ignore empty messages
    return [];
  });
}

function formatProposal(proposal: ProposalPayload): string {
  const routineName = proposal.name ?? "Unnamed routine";
  const exercises =
    proposal.exercises?.map((e) => e.name).join(", ") ?? "no exercises";
  return `Proposed routine: ${routineName} with exercises: ${exercises}`;
}
