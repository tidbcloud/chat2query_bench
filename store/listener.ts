import {
  addListener,
  createListenerMiddleware,
  isAnyOf,
} from "@reduxjs/toolkit";
import type { TypedAddListener, TypedStartListening } from "@reduxjs/toolkit";
import * as Sentry from "@sentry/nextjs";

import { REHYDRATE } from "redux-persist";
import { setModel } from "~/utils/trpc.header";
import { trpcClient } from "~/utils/trpc.vanilla";
import type { AppDispatch, RootState } from ".";
import { actions as accountActions } from "./account.slice";
import { actions as messageActions } from "./messages.slice";
import { selectSessionById } from "./selector";
import { actions as sessionActions } from "./session.slice";

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening =
  listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;

startAppListening({
  actionCreator: sessionActions.receivedMessage,
  effect: async (action) => {
    const { id, content, isUser, ancestors, meta } = action.payload.message;
    try {
      await trpcClient.insertMessage.mutate({
        id,
        convoId: action.payload.convoId,
        content,
        isUser,
        ancestors,
        meta,
      });
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  },
});

startAppListening({
  actionCreator: messageActions.editMessage,
  effect: async (action) => {
    const { id, content, ancestors, meta, bookmarked } = action.payload;
    try {
      await trpcClient.updateMessage.mutate({
        id,
        content,
        ancestors,
        meta,
        bookmarked,
      });
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  },
});

startAppListening({
  actionCreator: sessionActions.switchConversation,
  effect: async (action, listenerApi) => {
    const convoId = action.payload;
    const convo = selectSessionById(listenerApi.getState(), convoId);

    if (convo.messagesLoaded || !convo.dbSummaryId) {
      return;
    }

    listenerApi.dispatch(
      sessionActions.loadingMessage({ convoId, loading: true }),
    );
    try {
      const { data } = await trpcClient.listMessage.query({
        convoId,
      });

      listenerApi.dispatch(
        messageActions.saveMessages({ messages: data, convoId }),
      );
      listenerApi.dispatch(sessionActions.intialMessagesLoaded({ convoId }));
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  },
});

startAppListening({
  matcher: isAnyOf(messageActions.addBookmark, messageActions.removeBookmark),
  effect: async (action) => {
    const { messageId } = action.payload;
    try {
      await trpcClient.saveBookmark.mutate({
        id: messageId,
        bookmarked: action.type === messageActions.addBookmark.type,
      });
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  },
});

startAppListening({
  type: REHYDRATE,
  effect: (_, listenerApi) => {
    const s = listenerApi.getState();
    setModel(s.account.gptModel);
  },
});

startAppListening({
  actionCreator: accountActions.switchGptModel,
  effect: (action) => {
    setModel(action.payload);
  },
});
