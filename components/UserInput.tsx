import { IconCircleDot } from "@tabler/icons-react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  HoverCard,
  Kbd,
  Loader,
  Menu,
  SimpleGrid,
  Textarea,
  Tooltip,
  Typography,
} from "@tidbcloud/uikit";
import { getHotkeyHandler } from "@tidbcloud/uikit/hooks";
import { IconSend03 } from "@tidbcloud/uikit/icons";
import { useMemoizedFn } from "ahooks";
import React, { useRef, useState } from "react";
import { Panel } from "reactflow";

import { actions, useAppDispatch, useAppSelector } from "~/store";
import {
  selectIsSessionLoading,
  selectIsSessionStreaming,
  selectIsSessionThinking,
} from "~/store/selector";
import { getDatabaseUnderstandingMessage } from "~/utils/constants";
import { isMac } from "~/utils/isMac";
import { trpcNextClient } from "~/utils/trpc.next";

export function UserInput({ hasMessage }: { hasMessage: boolean }) {
  const model = useAppSelector((s) => s.account.gptModel);
  const currentSessionId = useAppSelector(
    (s) => s.session.currentConversationId,
  );
  const currentSession = useAppSelector((s) => s.session.map[currentSessionId]);
  const isLoading = useAppSelector((s) =>
    selectIsSessionLoading(s, currentSessionId),
  );
  const isStreaming = useAppSelector((s) =>
    selectIsSessionStreaming(s, currentSessionId),
  );
  const isThinking = useAppSelector((s) =>
    selectIsSessionThinking(s, currentSessionId),
  );
  const dispatch = useAppDispatch();
  const [value, setValue] = useState("");
  const loading = isLoading || isStreaming;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<{ abort: (() => void) | null }>({ abort: null });

  const handleSubmit = useMemoizedFn(() => {
    if (loading) {
      return;
    }
    if (!value || typeof value !== "string") {
      return;
    }

    const prompt = value.trim();
    if (prompt) {
      setValue("");
      const promise = dispatch(
        actions.session.userPromptSubmitted({ prompt, id: currentSessionId }),
      );
      abortRef.current.abort = () => promise.abort();
    }
  });

  const { data: models } = trpcNextClient.listModel.useQuery(undefined, {
    enabled: !!currentSession?.dbSummaryId,
  });

  if (
    !currentSession?.dbSummaryJobId &&
    !currentSession?.dbSummaryId &&
    !hasMessage
  ) {
    return null;
  }

  return (
    <Group
      pb={16}
      pt={16}
      px={8}
      sx={{
        position: "absolute",
        bottom: 0,
        margin: "auto",
        width: "100%",
        zIndex: 100,
      }}
    >
      <Box
        sx={{
          margin: "auto",
          width: "90%",
          maxWidth: 640,
          transitionDuration: ".2s",
        }}
      >
        {currentSession?.dbSummaryId && (
          <Group align="flex-end" sx={{ width: "100%", marginBottom: 8 }}>
            <Menu>
              <Menu.Target>
                <Button
                  size="xs"
                  variant="default"
                  radius="xl"
                  leftIcon={<IconCircleDot size={14} />}
                >
                  <Typography variant="body-sm">{model}</Typography>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {(models ?? ["gpt-4o-mini"]).map((i) => (
                  <Menu.Item
                    key={i}
                    onClick={() => {
                      dispatch(actions.account.switchGptModel(i as any));
                    }}
                  >
                    <Typography variant="body-sm">{i}</Typography>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Button
              size="xs"
              variant="default"
              radius="xl"
              onClick={() => {
                dispatch(
                  actions.session.understandDatabaseRequested({
                    message: getDatabaseUnderstandingMessage,
                    id: currentSessionId,
                  }),
                );
              }}
            >
              <Typography fw={400} color="#555">
                Get Database Summary
              </Typography>
            </Button>
          </Group>
        )}

        <Textarea
          placeholder="Get started by asking your data!"
          autosize
          minRows={1}
          maxRows={10}
          radius={32}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="md"
          ref={ref}
          style={{
            width: "100%",
          }}
          rightSection={
            isThinking ? (
              <Loader size="sm" />
            ) : (
              <Box>
                <HoverCard shadow="md" withArrow withinPortal>
                  <HoverCard.Target>
                    <ActionIcon radius="xl" size={56} onClick={handleSubmit}>
                      <IconSend03 size={24} />
                    </ActionIcon>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <Typography variant="body-md">
                      <SimpleGrid cols={2} spacing={8}>
                        <span>Send</span>
                        <span>
                          <Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd> + <Kbd>Enter</Kbd>
                        </span>
                        <span>Newline</span>
                        <span>
                          <Kbd>Enter</Kbd>
                        </span>
                      </SimpleGrid>
                    </Typography>
                  </HoverCard.Dropdown>
                </HoverCard>
              </Box>
            )
          }
          rightSectionWidth={60}
          styles={{
            input: {
              padding: 24,
              paddingTop: `16px !important`,
              paddingBottom: `16px !important`,
              "::-webkit-scrollbar": { display: "none" },
            },
          }}
          onKeyDown={getHotkeyHandler([["mod+Enter", handleSubmit]])}
        />
      </Box>
    </Group>
  );
}

export const FloatingUserInput = () => {
  const currentSessionId = useAppSelector(
    (s) => s.session.currentConversationId,
  );
  const isLoading = useAppSelector((s) =>
    selectIsSessionLoading(s, currentSessionId),
  );
  const isStreaming = useAppSelector((s) =>
    selectIsSessionStreaming(s, currentSessionId),
  );
  const isThinking = useAppSelector((s) =>
    selectIsSessionThinking(s, currentSessionId),
  );
  const dispatch = useAppDispatch();
  const [value, setValue] = useState("");
  const loading = isLoading || isStreaming;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<{ abort: (() => void) | null }>({ abort: null });

  const handleSubmit = useMemoizedFn(() => {
    if (loading) {
      return;
    }
    if (!value || typeof value !== "string") {
      return;
    }

    const prompt = value.trim();
    if (prompt) {
      setValue("");
      const promise = dispatch(
        actions.session.userPromptSubmitted({ prompt, id: currentSessionId }),
      );
      abortRef.current.abort = () => promise.abort();
    }
  });

  return (
    <Box
      className="app-floating-user-input"
      component={Panel}
      position="bottom-center"
      style={{
        width: value ? "80%" : "50%",
        transitionDuration: ".2s",
      }}
    >
      <Textarea
        placeholder="Get started by asking your data!"
        autosize
        minRows={1}
        maxRows={10}
        radius={16}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="md"
        ref={ref}
        rightSection={
          isThinking ? (
            <Loader size="sm" />
          ) : (
            <Box>
              <Tooltip label={`Send (${isMac() ? "Cmd" : "Ctrl"} + Enter)`}>
                <ActionIcon radius="xl" size={58} onClick={handleSubmit}>
                  <IconSend03 size={24} />
                </ActionIcon>
              </Tooltip>
            </Box>
          )
        }
        rightSectionWidth={60}
        styles={{
          root: {
            width: "100%",
          },
          input: {
            transitionDuration: ".2s",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            padding: 24,
            paddingTop: `16px !important`,
            paddingBottom: `16px !important`,
            "::-webkit-scrollbar": { display: "none" },
          },
        }}
        onKeyDown={getHotkeyHandler([["mod+Enter", handleSubmit]])}
      />
    </Box>
  );
};
