import {
  Badge,
  Box,
  Button,
  Center,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Typography,
} from "@tidbcloud/uikit";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef } from "react";

import { Message as MessageComponet } from "~/components/Message";
import { actions, useAppDispatch } from "~/store";
import type { Message } from "~/store/messages.slice";
import { trpcNextClient } from "~/utils/trpc.next";
import { useLargeScreen } from "~/utils/useLargeScreen";

export default function Share() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const id = router.query.id as string;
  const { data, isLoading } = trpcNextClient.readPublicLink.useQuery(
    {
      id,
    },
    {
      enabled: !!id,
      onSuccess(data) {
        if (data.result.length > 0) {
          dispatch(
            actions.messages.saveSharedMessage({
              messages: data.result!,
            }),
          );
        }
      },
    },
  );

  const largeScreen = useLargeScreen();
  const messages: Message[] = (data?.result as any) ?? [];
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box
      className="app-mainchat"
      style={{
        height: largeScreen ? "100vh" : window.innerHeight,
        maxWidth: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Group
        spacing={8}
        sx={{
          width: "min(80%, 1200px)",
          margin: "0 auto",
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: largeScreen ? 70 : 0,
        }}
      >
        <Group spacing={8}>
          <Typography variant="headline-lg">TiInsight</Typography>
          <Badge variant="outline">Experimental</Badge>
        </Group>

        <Typography variant="body-lg">Shared Chat</Typography>
      </Group>

      <Box
        sx={(theme) => ({
          backgroundColor: theme.white,
          width: "100%",
          flex: 1,
          maxHeight: `calc(${window.innerHeight}px - 136px)`,
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
        })}
      >
        <ScrollArea
          className="app-mainchat-scroller"
          viewportRef={ref}
          sx={{
            borderRadius: 24,
            flexGrow: 1,
          }}
          styles={{
            viewport: {
              width: "100%",
              "& > div": {
                display: "flex!important",
                flexDirection: "column",
              },
            },
          }}
        >
          <Box sx={{ width: "min(100%, 1200px)", margin: "0 auto" }}>
            {isLoading ? (
              <Stack>
                <Group px={16} noWrap>
                  <Stack sx={{ flex: 1 }} pt={32}>
                    <Skeleton height={16} radius="xl" />
                    <Skeleton height={16} mt={6} width="70%" radius="xl" />
                  </Stack>
                  <Skeleton circle mb="lg" height={36} />
                </Group>

                <Group px={16} noWrap>
                  <Skeleton circle mb="lg" height={36} />
                  <Stack sx={{ flex: 1 }} pt={32}>
                    <Skeleton height={16} radius="xl" />
                    <Skeleton height={16} mt={6} width="70%" radius="xl" />
                  </Stack>
                </Group>
              </Stack>
            ) : (
              messages.map((i) => (
                <MessageComponet id={i.id} key={i.id} isSharePage />
              ))
            )}
          </Box>
        </ScrollArea>
      </Box>

      <Center pb={8} pt={16} px={8} sx={{ position: "relative" }}>
        <Button component={Link} href="/">
          Go back to TiInsight
        </Button>
      </Center>
    </Box>
  );
}
