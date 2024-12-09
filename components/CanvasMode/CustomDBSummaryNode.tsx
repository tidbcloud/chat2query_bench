import { Card } from "@tidbcloud/uikit";
import { Handle, NodeProps, Position } from "reactflow";
import { useAppSelector } from "~/store";
import { selectMessageById } from "~/store/selector";
import { DataSummary } from "../DatabaseUnderstanding/DataSummary";
import { NodeLoadingSkeleton } from "./NodeLoadingSkeleton";

export function CustomDBSummaryNode({
  data,
}: NodeProps<{ id: string; label: string }>) {
  const message = useAppSelector((s) => selectMessageById(s, data.id));
  const isSelected = useAppSelector(
    (s) => s.messages.selectedNodes?.includes(data.id) ?? false,
  );

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
        <DataSummary db={message.meta as any} />
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
