import { sleep } from "~/utils/sleep";
import { trpcClient } from "~/utils/trpc.vanilla";

import type { QuestionSuggestions } from "~/server/api";
import type { MessageId } from "./messages.slice";

export interface Conversation {
  dbSummaryJobId?: string;
  dbSummaryId?: number;
  dbName?: string;
  sessionId?: number;
  createdTs: number;
  updatedTs: number;
  name: string;
  thinking?: boolean;
  creating?: boolean;
  isSample: boolean;
  sampleDbName?: string;
  messages: MessageId[];
  loadingMessages?: boolean;
  messagesLoaded?: boolean;
  id: string;
  suggestions?: QuestionSuggestions;
}

export type ConversationID = string;

export const DEFAULT_CONVO_NAME = "Untitled";

export async function* pollingJob(
  id: string,
  convoId: string,
): AsyncGenerator<
  | [Awaited<ReturnType<typeof trpcClient.queryJobDetail.query>>, null]
  | [null, unknown],
  void,
  void
> {
  while (true) {
    try {
      const result = await trpcClient.queryJobDetail.query({
        jobId: id,
        convoId,
      });
      yield [result, null];

      await sleep(1000);

      if (["done", "failed"].includes(result.result.status)) {
        break;
      }
    } catch (e) {
      yield [null, e];
      break;
    }
  }
}
