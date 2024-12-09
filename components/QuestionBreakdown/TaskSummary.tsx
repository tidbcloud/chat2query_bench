import { Box, Group, Stack, Typography } from "@tidbcloud/uikit";

import { Chat2DataBreakdownAnswer, TaskTreeNode } from "~/server/api";

interface QuestionBreakdownProps {
  task: Chat2DataBreakdownAnswer;
}

interface TreeNode {
  id: string;
  children?: TreeNode[];
}

export const TaskSummary = (props: QuestionBreakdownProps) => {
  const { task } = props;
  if (!task) return null;

  return (
    <Stack spacing={16}>
      <Stack spacing={8}>
        <Typography variant="headline-md">Task Summary</Typography>
        <Typography>{task?.description}</Typography>

        {!!task?.assumptions?.length && (
          <>
            <Typography variant="headline-md">Assumptions</Typography>
            {task?.assumptions.map((i) => (
              <Group key={i.concept} spacing={4}>
                <Typography>{i.concept}:</Typography>
                <Typography>{i.explanation}</Typography>
              </Group>
            ))}
          </>
        )}

        <Typography variant="headline-md">Clarified Task</Typography>
        <Typography>{task?.clarified_task}</Typography>
      </Stack>
    </Stack>
  );
};

function TaskTree(props: {
  node: TreeNode;
  taskMap: Record<string, TaskTreeNode>;
}) {
  const { node, taskMap } = props;

  const t = props.taskMap[node.id];

  if (!t) {
    return null;
  }

  return (
    <Box>
      {t.level !== 0 && <Typography size={14}>{t?.clarified_task}</Typography>}

      <Box component="ol" sx={{ paddingLeft: 20 }}>
        {!!node.children &&
          !!node.children.length &&
          node.children.map((i) => (
            <Box component="li" key={i.id}>
              <TaskTree node={i} taskMap={taskMap} />
            </Box>
          ))}
      </Box>
    </Box>
  );
}
