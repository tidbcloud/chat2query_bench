import { createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import { trpcClient } from "~/utils/trpc.vanilla";

import { notifier } from "@tidbcloud/uikit";
import { getQueryKey } from "@trpc/react-query";
import { queryClient } from "~/components/QueryClient";
import { trpcNextClient } from "~/utils/trpc.next";
import type { AppDispatch, RootState } from ".";
import { actions as accountActions } from "./account.slice";

export const createGuestAccount = createAsyncThunk<
  void,
  void,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>("acccount/createGuestAccountRequested", async (_, thunkApi) => {
  try {
    const id = localStorage.getItem("tiinsight:guest_id") || nanoid();

    const data = await queryClient.fetchQuery({
      queryKey: getQueryKey(trpcNextClient.signup),
      queryFn: () =>
        trpcClient.signup.mutate({
          email: `guest_${id}@tiinsight.chat`,
          password: id,
          isGuest: true,
        }),
    });

    thunkApi.dispatch(
      accountActions.saveUser({
        email: data.email,
        id: data.id,
        isGuest: true,
      }),
    );

    localStorage.setItem("tiinsight:guest_id", id);
  } catch (e) {
    if (e instanceof Error) {
      notifier.error(e.message);
    }
  }
});
