import { Box, LoadingOverlay, Stack } from "@tidbcloud/uikit";
import { useMount } from "ahooks";

import { actions, useAppDispatch, useAppSelector } from "~/store";
import { selectSessionLatestMessage } from "~/store/selector";
import { useLargeScreen } from "~/utils/useLargeScreen";

import { useIsFetching } from "@tanstack/react-query";
import { TRPCClientError, getQueryKey } from "@trpc/react-query";
import { ReactFlowProvider } from "reactflow";
import { match } from "ts-pattern";
import { trpcNextClient } from "~/utils/trpc.next";
import { CanvasChat } from "./CanvasMode/CanvasChat";
import { MainChat } from "./MainChat";
import { Sidepanel } from "./Sidepanel";

export function App() {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.session.currentConversationId);
  const mode = useAppSelector((s) => s.session.mode ?? "chat");
  const user = useAppSelector((s) => s.account.user);
  const lastMessage = useAppSelector((s) =>
    selectSessionLatestMessage(s, current),
  );
  const largeScreen = useLargeScreen();
  const loadingConversation =
    useIsFetching(getQueryKey(trpcNextClient.listConversation)) > 0;
  const isSigningup = useIsFetching(getQueryKey(trpcNextClient.signup)) > 0;
  const loading = loadingConversation || isSigningup || !user;

  trpcNextClient.listModel.useQuery(undefined, {
    onSuccess(data) {
      if (data.length > 0) {
        dispatch(actions.account.switchGptModel(data[0] as any));
      }
    },
    refetchOnMount: false,
  });

  const { refetch } = trpcNextClient.listConversation.useQuery(
    {},
    {
      retry: false,
      async onSuccess(data) {
        if (Array.isArray(data.data) && data.data.length === 0) {
          dispatch(actions.session.createNewConversation());
          return;
        }
        dispatch(actions.session.conversationLoaded(data));
        const first = data.data.at(0)?.id;

        if (first) {
          dispatch(actions.session.switchConversation(first));
        }
      },
      async onError(e) {
        if (e instanceof TRPCClientError) {
          if (e.message === "UNAUTHORIZED") {
            await dispatch(actions.account.createGuestAccount());
            await refetch();
          }
        }
      },
    },
  );

  useMount(() => {
    if (!user && !isSigningup) {
      dispatch(actions.account.createGuestAccount());
    }
  });

  useMount(() => {
    if (!current || !lastMessage) {
      return;
    }

    if (lastMessage.isLoading) {
      dispatch(
        actions.session.removeMessage({
          messageId: lastMessage.id,
          sessionId: current,
        }),
      );
    } else if (lastMessage.isStreaming) {
      dispatch(actions.messages.stopStreaming(lastMessage.id));
    }
  });

  const content = match(mode)
    .with("canvas", () => (
      <ReactFlowProvider>
        <CanvasChat key={current} />
      </ReactFlowProvider>
    ))
    .with("chat", () => <MainChat />)
    .otherwise(() => <MainChat />);

  if (largeScreen) {
    return (
      <Box
        sx={{ display: "flex", height: "100vh", width: "100vw" }}
        className="app"
      >
        <LoadingOverlay visible={loading} />
        <Sidepanel />
        {content}
      </Box>
    );
  }

  return (
    <Stack
      sx={{ height: window.innerHeight }}
      align="flex-start"
      className="app"
      spacing={0}
    >
      <LoadingOverlay visible={loading} />
      <Sidepanel />
      {content}
    </Stack>
  );
}
