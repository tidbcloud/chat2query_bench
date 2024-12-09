import { Stack, Table, Typography } from "@tidbcloud/uikit";

export interface TableDescriptionProps {
  description?: string;
  columns: Array<{ name: string; description: string }>;
}

export function TableDescription({
  description,
  columns,
}: TableDescriptionProps) {
  return (
    <Stack>
      {description && <Typography variant="label-lg">{description}</Typography>}

      <Stack spacing={8}>
        <Table
          highlightOnHover
          withBorder
          withColumnBorders
          sx={(theme) => ({ backgroundColor: theme.white })}
        >
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
