import {
  Box,
  Group,
  SegmentedControl,
  Stack,
  Typography,
} from "@tidbcloud/uikit";
import { ProTable } from "@tidbcloud/uikit/biz";
import { isArray, omit } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Chat2DataResolvedAnswer } from "~/server/api";

import { QuestionBreakdownChart } from "../Charts";

import { SQLPrism } from "./SQLPrism";

interface SQLChartProps {
  task: Chat2DataResolvedAnswer;
  messageId: string;
}

type ResultTab = "result" | "chart" | "sql";

export type ChartType = "BarChart" | "LineChart";

export function SQLChart(props: SQLChartProps) {
  const { task } = props;
  const { chart_options } = task;
  const optionY = chart_options?.option?.y;
  const withData = !!task.data.rows?.length && !!task.data.columns?.length;
  const suggestChart =
    task.chart_options?.chart_name &&
    task.chart_options?.chart_name !== "Table" &&
    !(
      chart_options?.option.pivot_column &&
      isArray(optionY) &&
      optionY?.length > 1
    );
  const withError = !!task.sql_error;
  const canShowChart = suggestChart && withData;
  const [content, setContent] = useState<ResultTab>(() => {
    if (canShowChart) return "chart";
    if (withData || withError) return "result";
    return "sql";
  });
  const [chartType, setChartType] = useState<ChartType>(
    task.chart_options?.chart_name as ChartType,
  );
  const columns = useMemo(
    () =>
      task.data.columns?.map((i) => ({
        header: i.col,
        accessorKey: i.col.replaceAll(".", ""),
      })),
    [task.data.columns],
  );

  const data = task.data.rows?.map((row) => {
    return row
      .map((i, index) => ({
        [task.data.columns?.[index]?.col.replaceAll(".", "")]: i,
      }))
      .reduce(
        (acc, next) => {
          return Object.assign(acc, next);
        },
        {} as Record<string, any>,
      );
  });

  useEffect(() => {
    setChartType(task.chart_options?.chart_name as ChartType);
  }, [task.chart_options?.chart_name]);

  return (
    <Stack className="sql-chart nowheel">
      <Group position="right">
        {content === "chart" && (
          <SegmentedControl
            size="xs"
            data={[
              {
                label: "Line",
                value: "LineChart",
              },
              { label: "Bar", value: "BarChart" },
            ]}
            value={chartType}
            onChange={(val: ChartType) => setChartType(val)}
          />
        )}
        <SegmentedControl
          size="xs"
          data={[
            {
              label: "Chart",
              value: "chart",
              show: withData && suggestChart,
            },
            { label: "Result", value: "result", show: true },
            { label: "SQL", value: "sql", show: true },
          ]
            .filter((i) => i.show)
            .map((i) => omit(i, "show"))}
          value={content}
          onChange={(val: ResultTab) => setContent(val)}
        />
      </Group>

      {match(content)
        .with("chart", () => (
          <QuestionBreakdownChart meta={task} chartType={chartType} />
        ))
        .with("sql", () => <SQLPrism code={task.sql} />)
        .with("result", () =>
          withData ? (
            <ProTable
              columns={columns}
              data={data}
              withBorder
              enableStickyHeader
              mantineTableProps={{
                withColumnBorders: true,
              }}
              mantineTableContainerProps={{
                sx: {
                  maxHeight: 398,
                  backgroundColor: "#fff",
                },
              }}
            />
          ) : (
            <Box sx={{ backgroundColor: "#fff", padding: 16, borderRadius: 8 }}>
              <Typography>{task.sql_error || "No Data"}</Typography>
            </Box>
          ),
        )
        .exhaustive()}
    </Stack>
  );
}
