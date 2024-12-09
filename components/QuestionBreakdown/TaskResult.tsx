import { Box, Stack, Typography } from "@tidbcloud/uikit";

import { Chat2DataResolvedAnswer, isResolvedAnswer } from "~/server/api";

import { SQLChart } from "./SQLChart";

interface TaskResultProps {
  task: Chat2DataResolvedAnswer;
  messageId: string;
  chartOnly: boolean;
}

export function TaskResult(props: TaskResultProps) {
  const { task, messageId, chartOnly } = props;

  return (
    <Stack spacing={16} w="100%">
      {chartOnly ? null : (
        <Stack spacing={8}>
          <div>
            <Typography variant="headline-md">
              {task.task_id === "0"
                ? "Task Summary"
                : `Subtask ${task.task_id} Summary`}
            </Typography>
            <Typography>{task?.description}</Typography>
          </div>

          <div>
            <Typography variant="headline-md">Clarified Task</Typography>
            <Typography>{task?.clarified_task}</Typography>
          </div>
        </Stack>
      )}

      {isResolvedAnswer(task) && (
        <Box bg="gray.0" p={16} w="100%" sx={{ borderRadius: 16 }}>
          <SQLChart task={task} messageId={messageId} />
        </Box>
      )}
    </Stack>
  );
}
