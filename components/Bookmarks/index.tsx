import {
  AppShell,
  Badge,
  Box,
  Center,
  Group,
  Header,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Typography,
} from "@tidbcloud/uikit";
import { useLocalStorage } from "@tidbcloud/uikit/hooks";
import { memo, useMemo } from "react";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { selectMessageById } from "~/store/selector";
import { parse } from "~/utils/markdown";
import { trpcNextClient } from "~/utils/trpc.next";

const Message = memo(function _Message({ id }: { id: string }) {
  const message = useAppSelector((s) => selectMessageById(s, id));
  const meta = message?.meta;
  const content = useMemo(
    () =>
      message?.content && meta ? (
        <Box w={message.isUser ? undefined : 600}>
          {parse(message.content, {
            meta: meta as any,
            messageId: message.id,
          })}
        </Box>
      ) : (
        "+"
      ),
    [message?.content, meta, message?.id, message?.isUser],
  );

  return <Box sx={{ position: "relative" }}>{content}</Box>;
});

export default function Bookmarks() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.account.user);
  const [selectedSession, setSelectedSession] = useLocalStorage({
    key: "booomark-from-session",
    defaultValue: "",
  });
  const { data, isLoading: isLoadingConvos } =
    trpcNextClient.listConversation.useQuery(
      {},
      {
        enabled: !!user,
        async onSuccess(data) {
          if (data.data.length > 0) {
            dispatch(actions.session.conversationLoaded(data));
            const first = data.data.at(0)?.id;
            if (first) {
              setSelectedSession(first);
            }
          }
        },
      },
    );
  const conversations = data?.data;
  const sessionOptions = useMemo(() => {
    const options = conversations?.map((i) => ({
      label: i.name,
      value: i.id,
    }));

    return options ?? [];
  }, [conversations]);

  const { data: messages, isLoading: isLoadingMessage } =
    trpcNextClient.listBookmarkedMessage.useQuery(
      { convoId: selectedSession },
      {
        enabled: !!conversations,
        onSuccess(data) {
          dispatch(
            actions.messages.saveMessages({
              messages: data.data,
              convoId: selectedSession,
            }),
          );
        },
      },
    );
  const sessionBookmarks = messages?.data ?? [];

  return (
    <AppShell
      header={
        <Header height={50} p="xs">
          <Group position="apart">
            <Group
              sx={{ cursor: "pointer" }}
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <Typography variant="headline-md">TiInsight</Typography>
              <Badge variant="outline">Experimental</Badge>
            </Group>

            <Group spacing={8}>
              <Typography variant="body-md">From conversation:</Typography>
              <Select
                data={sessionOptions}
                value={selectedSession}
                onChange={(val) => val && setSelectedSession(val)}
                size="xs"
              />
            </Group>
          </Group>
        </Header>
      }
      padding="lg"
    >
      <LoadingOverlay visible={isLoadingConvos || isLoadingMessage} />
      {sessionBookmarks.length === 0 ? (
        <Center>
          <Typography variant="body-lg">No bookmarks found</Typography>
        </Center>
      ) : (
        <SimpleGrid cols={2} maw={1200} m="auto">
          {sessionBookmarks.map((i) => (
            <Message id={i.id} key={i.id} />
          ))}
        </SimpleGrid>
      )}
    </AppShell>
  );
}
