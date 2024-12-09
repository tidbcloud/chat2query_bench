import { type PayloadAction, createSlice, nanoid } from "@reduxjs/toolkit";

import type { trpcClient } from "~/utils/trpc.vanilla";

import type { Message } from "./messages.slice";
import { actions as messageActions } from "./messages.slice";
import * as sessionThunks from "./session.thunk";
import {
  type Conversation,
  type ConversationID,
  DEFAULT_CONVO_NAME,
} from "./utils";

export interface ConversationSliceState {
  modal: "none" | "share" | "shareCreated" | "profile";
  modalProps: any;
  map: Record<ConversationID, Conversation>;
  list: ConversationID[];
  currentConversationId: ConversationID;
  mode: "chat" | "canvas";
}

const initialState: ConversationSliceState = {
  modal: "none",
  modalProps: {},
  map: {},
  list: [],
  currentConversationId: "",
  mode: "chat",
};

export type MessageOptions = Partial<Omit<Message, "content">>;

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    receivedMessage: {
      reducer(
        state,
        action: PayloadAction<{ message: Message; convoId: string }>,
      ) {
        const sessionId = action.payload.convoId;
        const messageId = action.payload.message.id;
        state.map[sessionId].messages.push(messageId);
        state.map[sessionId].updatedTs = Date.now();
        const nextList = state.list.filter((i) => i !== sessionId);
        nextList.unshift(sessionId);
        state.list = nextList;
      },
      prepare(
        content: string,
        sessionId: string,
        options: MessageOptions = {},
      ) {
        const {
          isLoading = false,
          isUser = false,
          isStreaming = false,
          meta,
          id,
        } = options;
        return {
          payload: {
            convoId: sessionId,
            message: {
              id: id ?? nanoid(),
              convoId: sessionId,
              content: `\n${content.trim()}\n`,
              ...options,
              isLoading,
              isStreaming,
              isUser,
              meta,
              bookmarked: false,
            },
          },
        };
      },
    },
    removeMessage(
      state,
      action: PayloadAction<{ messageId: string; sessionId: string }>,
    ) {
      const { messageId, sessionId } = action.payload;
      state.map[sessionId].messages = state.map[sessionId].messages.filter(
        (i) => i !== messageId,
      );
    },
    reset(state, action: PayloadAction<undefined | { sessionId: string }>) {
      if (!action.payload) {
        state.list = [];
        state.map = {};
        state.currentConversationId = "";
        state.modal = "none";
        return;
      }

      const sessionId = action.payload.sessionId;
      if (sessionId in state.map) {
        state.map[sessionId] = {
          ...state.map[sessionId],
          thinking: false,
          messages: state.map[sessionId].messages.slice(0, 1),
        };
      }
    },
    openModal(
      state,
      action: PayloadAction<{
        modal: ConversationSliceState["modal"];
        modalProps?: ConversationSliceState["modalProps"];
      }>,
    ) {
      state.modal = action.payload.modal;
      state.modalProps = action.payload.modalProps;
    },
    closeModal(state) {
      state.modal = "none";
      state.modalProps = {};
    },
    bindDatabaseSummary(
      state,
      action: PayloadAction<{
        id: string;
        context: NonNullable<
          Awaited<ReturnType<typeof trpcClient.bindDatabase.mutate>>
        >;
        creating?: boolean;
      }>,
    ) {
      const { id, context, creating = false } = action.payload;
      state.map[id].creating = creating;
      state.map[id].dbSummaryJobId = context.jobId;
      state.map[id].dbSummaryId = context.dbSummaryId;
      state.map[id].dbName = context.dbName;

      if (state.map[id].name === DEFAULT_CONVO_NAME) {
        state.map[id].name = context.dbName;
      }
    },
    switchConversation(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.currentConversationId = id;
    },
    deleteSession(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.list.length === 1) return;

      if (state.currentConversationId === id) {
        const next = state.list.find((i) => i !== id);
        if (next) {
          state.currentConversationId = next;
        }
      }
      state.list = state.list.filter((i) => i !== id);
      delete state.map[id];
    },
    renameSession(state, action: PayloadAction<{ name: string; id: string }>) {
      const { id, name } = action.payload;
      state.map[id].name = name;
    },
    stopThinking(state, action: PayloadAction<{ id: string }>) {
      state.map[action.payload.id].thinking = false;
    },
    updateConversation(
      state,
      action: PayloadAction<{ id: string } & Partial<Conversation>>,
    ) {
      const id = action.payload.id;
      state.map[id] = {
        ...state.map[id],
        ...action.payload,
      };
    },
    switchMode(
      state,
      action: PayloadAction<{ mode: ConversationSliceState["mode"] }>,
    ) {
      state.mode = action.payload.mode;
    },
    conversationLoaded(
      state,
      action: PayloadAction<
        Awaited<ReturnType<typeof trpcClient.listConversation.query>>
      >,
    ) {
      const conversations = action.payload.data;
      for (const i of conversations) {
        if (!state.list.includes(i.id)) {
          state.list.push(i.id);
        }
        state.map[i.id] = {
          id: i.id,
          name: i.name,
          thinking: false,
          creating: false,
          isSample: i.isSample,
          sampleDbName: i.sampleDbName,
          messages: [],
          dbSummaryId: i.summaryId ?? undefined,
          dbSummaryJobId: i.summaryJobId ?? undefined,
          sessionId: i.sessionId ?? undefined,
          createdTs: new Date(i.createdAt).valueOf(),
          updatedTs: new Date(i.updatedAt).valueOf(),
          suggestions: i.suggestions as string[],
        };
      }
    },
    loadingMessage(
      state,
      action: PayloadAction<{ convoId: string; loading: boolean }>,
    ) {
      state.map[action.payload.convoId].loadingMessages =
        action.payload.loading;
    },
    intialMessagesLoaded(state, action: PayloadAction<{ convoId: string }>) {
      state.map[action.payload.convoId].messagesLoaded = true;
      state.map[action.payload.convoId].loadingMessages = false;
    },
    saveNewConversation(state, action: PayloadAction<{ convo: Conversation }>) {
      const { id } = action.payload.convo;
      state.map[id] = action.payload.convo;
      if (!state.list.includes(id)) {
        state.list.unshift(id);
      }
    },
  },
  extraReducers(builder) {
    builder.addCase(
      sessionThunks.userPromptSubmitted.pending,
      (state, action) => {
        const id = action.meta.arg.id;
        state.map[id].thinking = true;
      },
    );
    builder.addCase(
      sessionThunks.userPromptSubmitted.fulfilled,
      (state, action) => {
        const id = action.meta.arg.id;
        state.map[id].thinking = false;
      },
    );
    builder.addCase(
      sessionThunks.userPromptSubmitted.rejected,
      (state, action) => {
        const id = action.meta.arg.id;
        state.map[id].thinking = false;
      },
    );
    builder.addCase(messageActions.saveMessages, (state, action) => {
      const id = action.payload.convoId;
      state.map[id].messages = action.payload.messages.map((i) => i.id);
    });
  },
});

export const actions = {
  ...sessionSlice.actions,
  ...sessionThunks,
};
