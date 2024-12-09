import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import { ActionIcon, Group, Tooltip } from "@tidbcloud/uikit";
import { useMemoizedFn } from "ahooks";
import { Position, NodeToolbar as ReactflowNodeToolbar } from "reactflow";
import { isResolvedQuestionBreakdown } from "~/server/api";
import { actions, useAppDispatch } from "~/store";
import { Message } from "~/store/messages.slice";

export function NodeToolbar({ data }: { data: Message }) {
  const dispatch = useAppDispatch();
  const isBookmarked = data.bookmarked;
  const isResolved = isResolvedQuestionBreakdown(data.meta);
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

  const tools = [
    {
      label: "Bookmark",
      icon: isBookmarked ? (
        <IconBookmarkFilled size={14} />
      ) : (
        <IconBookmark size={14} stroke={1.5} />
      ),
      onClick: () => {
        handleBookmarkOrUnbookmark(!isBookmarked);
      },
    },
  ];

  if (!isResolved) {
    return null;
  }

  return (
    <ReactflowNodeToolbar position={Position.Top} align="end" offset={4}>
      <Group spacing={4}>
        {tools.map((i) => (
          <Tooltip key={i.label} label={i.label} withArrow openDelay={1000}>
            <ActionIcon variant="light" size={24} onClick={i.onClick}>
              {i.icon}
            </ActionIcon>
          </Tooltip>
        ))}
      </Group>
    </ReactflowNodeToolbar>
  );
}
