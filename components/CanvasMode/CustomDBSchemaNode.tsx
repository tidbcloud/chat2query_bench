import { Card } from "@tidbcloud/uikit";
import { Handle, NodeProps, Position } from "reactflow";
import { DatabaseUnderstandingV2 } from "~/server/api";
import { useAppSelector } from "~/store";
import { selectMessageById } from "~/store/selector";
import { DatabaseSchema } from "../DatabaseUnderstanding/DatabaseSchema";
import { NodeLoadingSkeleton } from "./NodeLoadingSkeleton";

export function CustomDBSchemaNode({
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
      className="nodrag nowheel"
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
        <DatabaseSchema
          schema={(message.meta as DatabaseUnderstandingV2).tables}
          // sample={message.meta.tables_sample_data}
          // dbSchema={dbSchema!}
        />
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
