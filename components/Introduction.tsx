import {
  Box,
  Center,
  Divider,
  Group,
  Stack,
  Typography,
} from "@tidbcloud/uikit";

import { useLargeScreen } from "~/utils/useLargeScreen";

import { useAppSelector } from "~/store";
import { DatabaseSelector } from "./DatabaseSelector";

export function Introduction({ isCanvasMode }: { isCanvasMode?: boolean }) {
  const largeScreen = useLargeScreen();
  const sessionId = useAppSelector(
    (state) => state.session.currentConversationId,
  );
  const messages = useAppSelector(
    (state) => state.session.map[sessionId]?.messages ?? [],
  );

  if (messages.length > 0) {
    return <Box my={16} />;
  }

  return (
    <Stack pt={largeScreen ? 24 : 0} pb={32} m="auto">
      <Stack
        spacing={0}
        sx={{ position: "relative", left: largeScreen ? -60 : 0 }}
      >
        {largeScreen && (
          <Center>
            <Group>
              <Typography fw={700} size={36}>
                TiInsight
              </Typography>
            </Group>
          </Center>
        )}

        <Center>
          <Typography
            size={24}
            maw={700}
            sx={{ textAlign: "center", textWrap: "balance" }}
          >
            Your AI-powered assistant for data analysis
          </Typography>
        </Center>
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: largeScreen ? 16 : 8,
          flexDirection: largeScreen ? "row" : "column",
        }}
        px={largeScreen ? 32 : 16}
        py={largeScreen ? 24 : 0}
        maw={largeScreen ? "80%" : "100%"}
        m="auto"
      >
        <Stack justify="flex-start" spacing={largeScreen ? 16 : 4}>
          <Typography variant="headline-md">Chat2Query</Typography>
          <Typography variant="body-md" lh="24px">
            Transforming natural language into data insights through advanced
            data query techniques based on LLM.
          </Typography>
        </Stack>

        {largeScreen && <Divider orientation="vertical" mr={16} />}

        <Stack justify="flex-start" spacing={largeScreen ? 16 : 4}>
          <Typography variant="headline-md">Smart</Typography>
          <Typography variant="body-md" lh="24px">
            Our cutting-edge technology has aced the spider test, securing a
            TOP4 rank with an impressive accuracy rate exceeding 86%.
          </Typography>
        </Stack>

        {largeScreen && <Divider orientation="vertical" mr={16} />}

        <Stack justify="flex-start" spacing={largeScreen ? 16 : 4}>
          <Typography variant="headline-md">Unlimited</Typography>
          <Typography variant="body-md" lh="24px">
            Capable for handling massive dataset with unlimited number of tables
            and columns without LLM token limit through advanced data modeling
            technique.
          </Typography>
        </Stack>

        {largeScreen && <Divider orientation="vertical" mr={16} />}

        <Stack justify="flex-start" spacing={largeScreen ? 16 : 4}>
          <Typography variant="headline-md">OpenAPI</Typography>
          <Typography variant="body-md" lh="24px">
            All techniques are served as OpenAPI to enable quick integration
            with your own system.
          </Typography>
        </Stack>
      </Box>

      <DatabaseSelector isCanvasMode={isCanvasMode} />
    </Stack>
  );
}
