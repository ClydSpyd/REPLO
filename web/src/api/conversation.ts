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
};
