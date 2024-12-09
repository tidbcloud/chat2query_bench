import { Box, NavLink, ScrollArea } from "@tidbcloud/uikit";
import { useState } from "react";

import { DatabaseUnderstandingV2 } from "~/server/api";

import { TableDescription } from "./TableDescription";

type DatabaseSchemaProps = {
  schema: DatabaseUnderstandingV2["tables"];
  isCanvasMode?: boolean;
};

export function DatabaseSchema({ schema, isCanvasMode }: DatabaseSchemaProps) {
  const [currentTable, setCurrentTable] = useState("");
  const data = Object.values(schema).map((i) => {
    const columns = Object.values(i.columns);

    return {
      table: i.name,
      description: i.description,
      data: [],
      columns: columns.map((i) => ({
        name: i.name,
        description: i.description,
        accessorKey: i.name,
        header: i.name,
      })),
    };
  });

  if (!currentTable && data.length > 0) {
    setCurrentTable(data.at(0)!.table);
  }

  const current = data.find((i) => i.table === currentTable)!;

  if (!current) return null;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "row", gap: 8 }}
      h={isCanvasMode ? undefined : 392}
    >
      <Box component={ScrollArea} h="100%" miw={140} sx={{ flexShrink: 0 }}>
        {data.map((i) => (
          <NavLink
            key={i.table}
            label={i.table}
            active={i.table === currentTable}
            onClick={() => setCurrentTable(i.table)}
          />
        ))}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto" }} h="100%">
        <ScrollArea sx={{ flexGrow: 1, overflow: "auto" }} h={350}>
          <TableDescription
            columns={current.columns}
            description={current.description}
          />
        </ScrollArea>
      </Box>
    </Box>
  );
}
