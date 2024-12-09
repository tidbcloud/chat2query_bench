import { ProTable } from "@tidbcloud/uikit/biz";

export interface TableSampleDataProps {
  data: any[];
  columns: { header: string; accessorKey: string }[];
}

export function TableSampleData(props: TableSampleDataProps) {
  const { columns, data } = props;
  return (
    <ProTable
      columns={columns}
      data={data}
      mantineTableProps={{
        withColumnBorders: true,
        sx: (theme) => ({
          "thead th": {
            backgroundColor: theme.colors.gray[1],
          },
        }),
      }}
      mantineTableContainerProps={{
        sx: {
          minHeight: 200,
          maxHeight: 400,
          backgroundColor: "#fff",
        },
      }}
    />
  );
}
