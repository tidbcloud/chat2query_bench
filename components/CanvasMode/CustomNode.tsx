import { Box, Card, Tooltip } from "@tidbcloud/uikit";
import { IconMagicWand02 } from "@tidbcloud/uikit/icons";
import { useMemo } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { useAppSelector } from "~/store";
import { selectCurrentSession, selectMessageById } from "~/store/selector";
import { ping } from "~/utils/animation";
import { parse } from "~/utils/markdown";
import { RootNodeId } from "./CanvasChat";
import { NodeLoadingSkeleton } from "./NodeLoadingSkeleton";
import { NodeToolbar } from "./NodeToolbar";

export function CustomNode({ data }: NodeProps<{ id: string }>) {
  const message = useAppSelector((s) => selectMessageById(s, data.id));
  const isSelected = useAppSelector(
    (s) => s.messages.selectedNodes?.includes(data.id) ?? false,
  );
  const currentSession = useAppSelector(selectCurrentSession);
  const content = useMemo(
    () =>
      message?.content ? (
        <Box w={message.isUser ? undefined : 600}>
          {parse(message.content, {
            meta: message.meta as any,
            messageId: message.id,
          })}
        </Box>
      ) : (
        "+"
      ),
    [message?.content, message?.meta, message?.id, message?.isUser],
  );

  if (!currentSession?.dbSummaryId) {
    return null;
  }

  if (data.id === RootNodeId) {
    return (
      <Tooltip label="Ask questions to create new branch" withArrow>
        <Box
          className="nodrag"
          sx={(theme) => ({
            width: 48,
            height: 48,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "50%",
            borderWidth: 4,
            borderStyle: "solid",
            borderColor: theme.colors.cyan[3],
            cursor: "pointer",
            position: "relative",
          })}
        >
          <Box
            sx={(theme) => ({
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              borderRadius: "50%",
              borderWidth: 4,
              borderStyle: "solid",
              borderColor: theme.colors.cyan[3],
              boxShadow: `rgb(255, 255, 255) 0px 0px 0px 0px, ${theme.fn.rgba(
                theme.colors.cyan[3],
                0.7,
              )} 0px 0px 0px 8px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`,
              animation: `${ping} 3s cubic-bezier(0, 0, 0.5, 1) infinite`,
            })}
          />

          <IconMagicWand02 />
          <Handle
            type="source"
            position={Position.Bottom}
            id={data.id}
            style={{ visibility: "hidden" }}
          />
          <Handle
            type="target"
            position={Position.Top}
            id={data.id}
            style={{ visibility: "hidden" }}
          />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Card
      radius="lg"
      shadow="sm"
      className="nodrag"
      data-messageid={data.id}
      sx={(theme) => ({
        borderWidth: 4,
        borderStyle: "solid",
        borderColor: isSelected ? theme.colors.cyan[3] : "transparent",
        cursor: "pointer",
        position: "relative",
      })}
    >
      <NodeToolbar data={message} />
      {process.env.NODE_ENV === "development" && data.id}

      {message.isLoading ? <NodeLoadingSkeleton /> : content}

      <Handle
        type="source"
        position={Position.Bottom}
        id={data.id}
        style={{ visibility: "hidden" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id={data.id}
        style={{ visibility: "hidden" }}
      />
    </Card>
  );
}
