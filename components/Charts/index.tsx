import { Box } from "@tidbcloud/uikit";
import { camelCase, mapValues, upperFirst } from "lodash-es";
import React from "react";

import { BarChart } from "~/components/Charts/BarChart";
import { LineChart } from "~/components/Charts/LineChart";
import { PieChart } from "~/components/Charts/PieChart";
import { TableChart } from "~/components/Charts/Table";
import type { Chat2DataResolvedAnswer } from "~/server/api";

import { ChartType } from "../QuestionBreakdown/SQLChart";

export const ChartMap = {
  BarChart,
  PieChart,
  LineChart,
  Table: TableChart,
};

const pascalCase = (s: string) => upperFirst(camelCase(s));

interface QuestionBreakdownChartProps {
  meta: Pick<Chat2DataResolvedAnswer, "chart_options" | "data">;
  chartType: ChartType;
}

export const QuestionBreakdownChart = (props: QuestionBreakdownChartProps) => {
  const chartInfo = props.meta.chart_options;
  const chart = ChartMap[props.chartType] ?? ChartMap.BarChart;
  const columnsObj = props.meta.data.columns.reduce(
    (acc, next) => {
      acc[pascalCase(next.col)] = { col: next.col.toLocaleLowerCase() };
      return acc;
    },
    {} as Record<string, { col: string }>,
  );
  const rows = props.meta.data.rows.map((row) => {
    return row
      .map((i, index) => ({
        [pascalCase(props.meta.data.columns?.[index]?.col)]: i,
      }))
      .reduce(
        (acc, next) => {
          // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
          return { ...acc, ...next };
        },
        {} as Record<string, any>,
      );
  });

  return (
    <Box>
      {React.createElement(chart as any, {
        chartInfo: {
          title: chartInfo?.title,
          options: mapValues(chartInfo?.option, (value) =>
            Array.isArray(value)
              ? value.map((i) => pascalCase(i))
              : pascalCase(value),
          ),
        },
        columns: columnsObj,
        data: rows,
        fields: props.meta.data.columns.map((i) => ({
          name: i.col,
        })),
      })}
    </Box>
  );
};
