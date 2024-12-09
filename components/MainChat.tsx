import { Box, Center, Loader, ScrollArea } from "@tidbcloud/uikit";
import { useEffect, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import { useAppSelector } from "~/store";
import {
  selectCurrentSession,
  selectSessionLatestMessage,
} from "~/store/selector";
import { useLargeScreen } from "~/utils/useLargeScreen";

import { GlobalModal } from "./GlobalModals";
import { Introduction } from "./Introduction";
import { Message } from "./Message";
import { UserInput } from "./UserInput";

const MessageLoader = () => {
  return (
    <Center>
      <Loader size="sm" />
    </Center>
  );
};

export function MainChat() {
  const largeScreen = useLargeScreen();
  const session = useAppSelector(selectCurrentSession);
  const sessionId = useAppSelector(
    (state) => state.session.currentConversationId,
  );
  const messages = useAppSelector(
    (state) => state.session.map[sessionId]?.messages ?? [],
  );
  const lastMessage = useAppSelector((s) =>
    selectSessionLatestMessage(s, sessionId),
  );
  const virtualListRef = useRef<VirtuosoHandle>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    virtualListRef.current?.scrollToIndex(messages.length - 1);
  }, [messages.length, lastMessage]);

  return (
    <Box
      className="app-mainchat"
      style={{
        flexGrow: 1,
        height: largeScreen ? "100%" : "calc(100% - 50px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingBottom: 120,
        width: "100%",
      }}
    >
      <Virtuoso
        style={{ position: "relative" }}
        totalCount={messages.length}
        ref={virtualListRef}
        followOutput="auto"
        components={{
          Scroller: ScrollArea,
          //@ts-ignore
          Header: Introduction,
          Footer: session?.loadingMessages ? MessageLoader : undefined,
        }}
        itemContent={(i) => (
          <Message
            id={messages[i]}
            scrollIntoView={(i) => virtualListRef.current?.scrollToIndex(i)}
          />
        )}
      />

      <UserInput hasMessage={messages.length > 0} />

      <GlobalModal />
    </Box>
  );
}
