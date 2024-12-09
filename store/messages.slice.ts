import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

import { omit } from "lodash-es";
import { DatabaseUnderstandingMessageProps } from "~/components/DatabaseUnderstanding";
import { DatasetSwitchedMessageProps } from "~/components/DatasetSwitched";
import { QuestionBreakdownProps } from "~/components/QuestionBreakdown";
import { trpcClient } from "~/utils/trpc.vanilla";
import { actions as sessionActions } from "./session.slice";
import type { ConversationID } from "./utils";

export type MessageId = string;

export interface Message {
  id: MessageId;
  convoId: ConversationID;
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  isUser: boolean;
  ancestors?: MessageId[];
  isLeaf?: boolean;
  isRoot?: boolean;
  bookmarked: boolean;
  meta?:
    | DatabaseUnderstandingMessageProps["meta"]
    | QuestionBreakdownProps["meta"]
    | DatasetSwitchedMessageProps["meta"];
}

// for canvas mode
export interface MessageFlowNode {
  id: MessageId;
  children?: MessageFlowNode[];
}

export type MessageFlow = MessageFlowNode[];

export type MessageFlowRecord = Record<ConversationID, MessageFlow>;

export interface MessagesState {
  raw: Record<MessageId, Message>;
  flow: MessageFlowRecord;
  selectedNodes: MessageId[];
}

export const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    raw: {},
    flow: {},
    selectedNodes: [],
  } as MessagesState,
  reducers: {
    editMessage(state, action: PayloadAction<Message>) {
      const message = action.payload;
      state.raw[message.id] = message;
    },
    stopStreaming(state, action: PayloadAction<MessageId>) {
      if (state.raw[action.payload]) {
        state.raw[action.payload].isStreaming = false;
      }
    },
    saveSharedMessage(
      state,
      action: PayloadAction<{
        messages: Awaited<
          ReturnType<typeof trpcClient.readPublicLink.query>
        >["result"];
      }>,
    ) {
      const messages = action.payload.messages;
      for (const i of messages) {
        state.raw[i.id] = {
          id: i.id,
          convoId: i.conversationId,
          content: i.content ?? "",
          isUser: i.isByUser,
          ancestors: (i.metadata as any).ancestors,
          bookmarked: i.bookmarked,
          meta: omit(i.metadata as any, "ancestors") as any,
        };
      }
    },
    selectNode(state, action: PayloadAction<{ nodes: MessageId[] }>) {
      state.selectedNodes = [...action.payload.nodes];
    },
    addBookmark(state, action: PayloadAction<{ messageId: string }>) {
      const { messageId } = action.payload;
      state.raw[messageId].bookmarked = true;
    },
    removeBookmark(state, action: PayloadAction<{ messageId: string }>) {
      const { messageId } = action.payload;
      state.raw[messageId].bookmarked = false;
    },
    saveMessages(
      state,
      action: PayloadAction<{
        convoId: string;
        messages: Awaited<
          ReturnType<typeof trpcClient.listMessage.query>
        >["data"];
      }>,
    ) {
      for (const i of action.payload.messages) {
        state.raw[i.id] = {
          id: i.id,
          convoId: i.conversationId,
          content: i.content ?? "",
          isUser: i.isByUser,
          ancestors: (i.metadata as any).ancestors,
          bookmarked: i.bookmarked,
          meta: omit(i.metadata as any, "ancestors") as any,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionActions.receivedMessage, (state, action) => {
      const message = action.payload.message;
      state.raw[message.id] = message;
      if (!state.flow) {
        state.flow = {};
      }
      if (!state.flow?.[message.convoId]) {
        state.flow[message.convoId] = [];
      }
      const flow = state.flow[message.convoId];

      if (message.isUser) {
        // create new branch by default
        flow.push({ id: message.id, children: [] });
      } else if (message.ancestors) {
        let branch = flow.find((i) => i.id === message.ancestors?.at(0));

        for (const i of message.ancestors.slice(1)) {
          if (branch) {
            const next = branch.children?.find((item) => item.id === i);
            if (next) {
              branch = next;
            }
          }
        }

        branch?.children?.push({ id: message.id, children: [] });
      }
    });
    builder.addCase(sessionActions.reset, (state, action) => {
      if (!action.payload) {
        state.raw = {};
        return;
      }
      const resetSessionId = action.payload?.sessionId;
      const messages = Object.values(state.raw).filter(
        (i) => i.convoId === resetSessionId,
      );

      for (const m of messages) {
        delete state.raw[m.id];
      }
    });
    builder.addCase(sessionActions.removeMessage, (state, action) => {
      const id = action.payload.messageId;
      if (id in state.raw) {
        delete state.raw[id];
      }
    });
  },
});

export const actions = { ...messagesSlice.actions };
