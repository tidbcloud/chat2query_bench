import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import { actions as accountActions, accountSlice } from "./account.slice";
import { listenerMiddleware } from "./listener";
import { actions as messageActions, messagesSlice } from "./messages.slice";
import { actions as sessionActions, sessionSlice } from "./session.slice";

const reducers = combineReducers({
  session: sessionSlice.reducer,
  messages: messagesSlice.reducer,
  account: persistReducer(
    {
      key: "account",
      storage,
      version: 1,
      blacklist: ["gptModel"],
    },
    accountSlice.reducer,
  ),
});

export const store = configureStore({
  reducer: reducers,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).prepend(listenerMiddleware.middleware),
});

export const actions = {
  session: sessionActions,
  messages: messageActions,
  account: accountActions,
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
