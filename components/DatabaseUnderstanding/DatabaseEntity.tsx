import { Group, Stack, Table, Typography } from "@tidbcloud/uikit";

export interface DatabaseEntityProps {
  entities: Array<{ name: string; summary: string; involved_tables: string[] }>;
}

export function DatabaseEntity({ entities }: DatabaseEntityProps) {
  return (
    <Stack spacing={0}>
      <Typography variant="headline-sm">About entities</Typography>
      <Typography variant="body-lg" mb={16}>
        We aggregate your data for your major entities to help find better
        relationships with insight into your data.
      </Typography>

      <Table
        cellSpacing={0}
        mih={400}
        highlightOnHover
        withColumnBorders
        withBorder
        sx={(theme) => ({ backgroundColor: theme.white })}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Summary</th>
            <th>Related Tables</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((i, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <tr key={index}>
              <td>{i.name}</td>
              <td>{i.summary}</td>
              <td>
                <Group>
                  {i.involved_tables.map((item) => (
                    <Typography variant="body-md" key={item}>
                      {item}
                    </Typography>
                  ))}
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
