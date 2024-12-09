import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import * as accountThunks from "./account.thunk";

export interface AccountState {
  user?: {
    email: string;
    id: string;
    isGuest?: boolean;
  };
  gptModel: "gpt-4" | "gpt-4o-mini" | "gpt-4o";
}

const initialState: AccountState = {
  user: undefined,
  gptModel: "gpt-4o-mini",
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    saveUser(state, action: PayloadAction<Required<AccountState["user"]>>) {
      state.user = action.payload;
    },
    switchGptModel(state, action: PayloadAction<AccountState["gptModel"]>) {
      state.gptModel = action.payload;
    },
  },
});

export const actions = {
  ...accountSlice.actions,
  ...accountThunks,
};
