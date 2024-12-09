import {
  IconBookmark,
  IconBookmarkFilled,
  IconShare,
} from "@tabler/icons-react";
import {
  Avatar,
  Box,
  Button,
  Group,
  Typography,
  useMantineTheme,
} from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";
import { useMemo } from "react";

import { isDatabaseUnderstandingV2, isResolvedAnswer } from "~/server/api";
import { actions, useAppDispatch, useAppSelector } from "~/store";
import { selectCurrentSession, selectMessageById } from "~/store/selector";
import { parse } from "~/utils/markdown";
import { useLargeScreen } from "~/utils/useLargeScreen";

import { trpcNextClient } from "~/utils/trpc.next";
import { Typewriter } from "./TypeWriter";

export interface MessageProps {
  id: string;
  scrollIntoView?: (i: number) => void;
  isSharePage?: boolean;
}

export function Message({
  id,
  scrollIntoView = () => {},
  isSharePage = false,
}: MessageProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.account.user);
  const data = useAppSelector((s) => selectMessageById(s, id));
  const isBookmarked = data.bookmarked;
  const currentSession = useAppSelector(selectCurrentSession);
  const currentSessionId = currentSession?.id;
  const theme = useMantineTheme();

  const { data: sqlResult } = trpcNextClient.rerunSQL.useQuery(
    {
      convoId: data.convoId,
      messageId: id,
    },
    {
      enabled:
        isSharePage &&
        isResolvedAnswer(data.meta) &&
        typeof data.meta?.sql === "string" &&
        data.meta?.sql.length > 0,
    },
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const content = useMemo(
    () => {
      if (!data || !data.content || data.isLoading) {
        return null;
      }

      if (data.isUser) {
        return data?.content;
      }

      if (data.meta) {
        return parse(data?.content, {
          meta: isResolvedAnswer(data.meta)
            ? {
                ...data?.meta,
                data: sqlResult?.data ?? data.meta.data,
              }
            : data?.meta,
          messageId: data.id,
          scrollIntoView,
        });
      }

      return data.content.trimStart().startsWith("<") ? null : data.content;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.content, data?.meta, data?.id],
  );

  const canInteractMessage = useMemo(
    () => isResolvedAnswer(data?.meta) && !isSharePage,
    [data?.meta, isSharePage],
  );

  const messageBg = data?.isUser
    ? theme.fn.rgba(theme.colors.blue[4], 0.5)
    : theme.fn.rgba(theme.colors.gray[2], 0.6);

  const handleBookmarkOrUnbookmark = useMemoizedFn((bookmark: boolean) => {
    if (bookmark) {
      dispatch(
        actions.messages.addBookmark({
          messageId: data.id,
        }),
      );
    } else {
      dispatch(
        actions.messages.removeBookmark({
          messageId: data.id,
        }),
      );
    }
  });

  if (!data) {
    return null;
  }

  return (
    <Box
      className="message"
      data-message-id={id}
      sx={(theme) => ({
        padding: "8px 16px",

        "&.highlight .message-content": {
          backgroundColor: theme.colors.yellow[3],
        },
        "&.transitionBg .message-content": {
          transition: "background-color 1s",
        },
      })}
      fz={14}
    >
      <Box
        sx={{
          display: data.isUser ? "flex" : "block",
          flexDirection: data.isUser ? "row-reverse" : undefined,
          maxWidth: 1200,
          margin: "auto",
        }}
      >
        {!data.isUser && (
          <Group spacing={8} mb={4}>
            <Avatar src={null} radius="lg" size={24} color="blue">
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="rgba(182, 228, 251, 1)"
              >
                <path d="M632.32 466.56c-22.4 0-40.32 17.92-40.32 40.32v98.56c0 21.76 17.92 40.32 40.32 40.32s40.32-17.92 40.32-40.32V506.88c0-22.4-17.92-40.32-40.32-40.32z m-241.28 0c-22.4 0-40.32 17.92-40.32 40.32v98.56c0 21.76 17.92 40.32 40.32 40.32s40.32-17.92 40.32-40.32V506.88c0-22.4-17.92-40.32-40.32-40.32z m0 0" />
                <path d="M924.8 576c-21.76-153.6-141.44-296.96-396.8-302.72l24.96-92.16c28.8-3.84 51.2-28.16 51.2-58.24 0-32.64-26.24-58.88-58.88-58.88S486.4 90.24 486.4 122.88c0 19.2 8.96 35.84 23.04 46.72l-28.16 104.32C236.16 284.8 120.96 425.6 99.2 576c-22.4 156.8-25.6 272 122.88 335.36 152.96 65.28 430.72 64 579.2 0S947.2 732.8 924.8 576zM512 773.12c-357.76 0-347.52-92.8-327.68-212.48C204.8 440.96 330.88 348.16 512 348.16c181.12 0 307.2 92.8 327.68 212.48 19.84 119.68 30.08 212.48-327.68 212.48z m0 0" />
              </svg>
            </Avatar>
            <Typography variant="body-md">Assistant</Typography>
          </Group>
        )}
        <Box
          className="message-content"
          sx={() => ({
            backgroundColor: messageBg,
            padding: "8px 16px",
            borderRadius: 8,
          })}
        >
          {data?.isLoading ? (
            <Box>
              <Typewriter content={data.content?.trim() || "..."} ellipsis />
            </Box>
          ) : (
            <Box>
              {content}
              {data?.isStreaming && <Typewriter content="..." ellipsis />}

              {!data.isUser && canInteractMessage && (
                <Group p={0} spacing={8} mt={8}>
                  <Button
                    size="xs"
                    variant="default"
                    radius="xl"
                    leftIcon={
                      isBookmarked ? (
                        <IconBookmarkFilled size={16} />
                      ) : (
                        <IconBookmark size={16} />
                      )
                    }
                    onClick={() => {
                      if (user?.isGuest) {
                        dispatch(
                          actions.session.openModal({
                            modal: "profile",
                            modalProps: {
                              title: "Profile",
                            },
                          }),
                        );
                        return;
                      }
                      handleBookmarkOrUnbookmark(!isBookmarked);
                    }}
                  >
                    Bookmark
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    radius="xl"
                    leftIcon={<IconShare stroke={1.5} size={16} />}
                    onClick={() => {
                      if (user?.isGuest) {
                        dispatch(
                          actions.session.openModal({
                            modal: "profile",
                            modalProps: {
                              title: "Profile",
                            },
                          }),
                        );
                        return;
                      }
                      dispatch(
                        actions.session.openModal({
                          modal: "share",
                          modalProps: {
                            title: "Create a public link to share",
                            sessionId: data.convoId ?? currentSessionId,
                            messageId: data.id,
                          },
                        }),
                      );
                    }}
                  >
                    Share
                  </Button>
                </Group>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
