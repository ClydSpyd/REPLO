import { baseClient } from '.';
import type { CoachMessage } from './assistant';

export interface MessagePage {
  conversationId: string | null;
  messages: CoachMessage[];
  total: number;
  hasMore: boolean;
}

export const conversationMethods = {
  /** A page of the user's active conversation, newest-end first. */
  getActive: async (offset = 0, limit = 10) => {
    const { data } = await baseClient.get<MessagePage>('/conversation/active', {
      params: { offset, limit },
    });
    return data;
  },

  /** Record a proposal's outcome (accepted/dismissed). */
  updateProposalStatus: async (
    proposalId: string,
    status: 'accepted' | 'dismissed',
    routineId?: string,
  ) => {
    const { data } = await baseClient.patch<{ updated: boolean }>(
      `/conversation/proposals/${proposalId}`,
      { status, routineId },
    );
    return data;
  },
};
