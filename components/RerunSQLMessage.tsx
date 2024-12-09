import { Box, ScrollArea, Stack, Typography } from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";

import { useAppSelector } from "~/store";
import type { MessageId } from "~/store/messages.slice";

import { Prism } from "./QuestionBreakdown/Prism";

export interface RerunSQLMessageProps {
  meta: {
    refer: MessageId;
    sql: string;
  };
  // eslint-disable-next-line no-unused-vars
  scrollIntoView: (i: number) => void;
}

export function RerunSQLMessage({
  meta,
  scrollIntoView,
}: RerunSQLMessageProps) {
  const { refer, sql } = meta;
  const sessionId = useAppSelector(
    (state) => state.session.currentConversationId,
  );
  const messages = useAppSelector(
    (state) => state.session.map[sessionId]?.messages ?? [],
  );

  const onReferClick = useMemoizedFn(() => {
    const i = messages.findIndex((idx) => idx === refer);
    if (i !== -1) {
      scrollIntoView(i);
    }
    setTimeout(() => {
      const el = document.querySelector(`.message[data-message-id=${refer}]`);
      if (el) {
        el.classList.add("highlight");
        el.classList.add("transitionBg");
      }
    }, 300);
    setTimeout(() => {
      const el = document.querySelector(`.message[data-message-id=${refer}]`);
      if (el) {
        // el.classList.add("transitionBg");
        el.classList.remove("highlight");
      }
    }, 5000);
  });

  return (
    <Stack spacing={8}>
      <Box
        onClick={onReferClick}
        sx={(theme) => ({
          borderLeft: `4px solid ${theme.colors.gray[5]}`,
          paddingLeft: 8,
          marginTop: 4,
          lineHeight: "26px",
          cursor: "pointer",
        })}
      >
        <Typography variant="body-md">
          Reply to{" "}
          {/* {`${mapTaskId(referMessage.meta.task_id)} ${
            referMessage.meta.clarified_task
          }`} */}
        </Typography>
      </Box>
      <Stack spacing={4}>
        <Typography>Re-run task with following SQL</Typography>
        <ScrollArea h={200}>
          <Prism bg="#F4F4F4">{sql}</Prism>
        </ScrollArea>
      </Stack>
    </Stack>
  );
}
