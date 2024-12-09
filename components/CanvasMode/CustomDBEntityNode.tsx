import { Card } from "@tidbcloud/uikit";
import { Handle, NodeProps, Position } from "reactflow";
import { useAppSelector } from "~/store";
import { selectMessageById } from "~/store/selector";
import {
  DatabaseEntity,
  DatabaseEntityProps,
} from "../DatabaseUnderstanding/DatabaseEntity";
import { NodeLoadingSkeleton } from "./NodeLoadingSkeleton";

export function CustomDBEntityNode({
  data,
}: NodeProps<{ id: string; label: string }>) {
  const message = useAppSelector((s) => selectMessageById(s, data.id));
  const isSelected = useAppSelector(
    (s) => s.messages.selectedNodes?.includes(data.id) ?? false,
  );

  const entities = message.meta
    ? //@ts-ignore
      (Object.values(message.meta.entity) as DatabaseEntityProps["entities"])
    : null;

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
      })}
    >
      {process.env.NODE_ENV === "development" && data.label}

      {message.meta ? (
        <DatabaseEntity entities={entities!} />
      ) : (
        <NodeLoadingSkeleton />
      )}
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
