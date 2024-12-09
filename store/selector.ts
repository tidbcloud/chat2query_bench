import { createSelector } from "@reduxjs/toolkit";

import type { Message, MessageId } from "./messages.slice";
import type { ConversationID } from "./utils";

import type { RootState } from ".";

export const selectRawMessages = (state: RootState) => state.messages.raw;

export const selectMessageById = createSelector(
  [selectRawMessages, (_, id: MessageId) => id],
  (map, id) => map[id],
);

const selectSessions = (state: RootState) => state.session.map;
export const selectSessionById = createSelector(
  [selectSessions, (_, id: ConversationID) => id],
  (map, id) => map[id],
);
export const selectSessionMessageIds = createSelector(
  [selectSessions, (_, id: ConversationID) => id],
  (sessions, id) => sessions[id]?.messages,
);

export const selectSessionMessages = createSelector(
  selectSessionMessageIds,
  selectRawMessages,
  (messageIds, map) => messageIds?.map((id) => map[id]),
);

export const selectSessionLatestMessage = createSelector(
  selectSessionMessageIds,
  selectRawMessages,
  (messageIds, map) =>
    messageIds?.length > 0 ? map[messageIds.at(-1)!] : null,
);

export const selectIsSessionLoading = createSelector(
  selectSessionLatestMessage,
  (message) => message?.isLoading ?? false,
);

export const selectIsSessionStreaming = createSelector(
  selectSessionLatestMessage,
  (message) => message?.isStreaming ?? false,
);

export const selectIsSessionThinking = createSelector(
  [selectSessions, (_, id: ConversationID) => id],
  (sessions, id) => sessions[id]?.thinking ?? false,
);

export const selectCurrentSessionId = (state: RootState) =>
  state.session.currentConversationId;
export const selectCurrentSession = createSelector(
  [selectSessions, selectCurrentSessionId],
  (map, id) => map[id],
);

const selectMessageFlow = (state: RootState) => state.messages.flow;

export const selectCurrentSessionFlow = createSelector(
  [selectMessageFlow, selectCurrentSessionId],
  (flow, id) => flow?.[id] ?? [],
);
