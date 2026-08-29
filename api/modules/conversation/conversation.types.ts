export type ProposalStatus = "pending" | "accepted" | "dismissed";

/** A proposed exercise as stored on a proposal message. */
export interface ProposedExercise {
  exerciseId: string;
  name: string;
  primaryMuscleGroups: string[];
  sets: { reps: number; weight: number }[];
}

export interface ProposalPayload {
  name: string;
  description?: string;
  tags: string[];
  exercises: ProposedExercise[];
}

/** One stored turn. Text turns use role/content; proposal turns carry a card. */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  /** Stable id for a proposal turn; the key status updates target. */
  proposalId?: string;
  proposal?: ProposalPayload;
  status?: ProposalStatus;
  /** Set when a proposal is accepted → links to the created routine. */
  routineId?: string;
}

/** A page of messages counted from the newest end of the conversation. */
export interface MessagePage {
  conversationId: string | null;
  messages: ConversationMessage[];
  total: number;
  hasMore: boolean;
}
