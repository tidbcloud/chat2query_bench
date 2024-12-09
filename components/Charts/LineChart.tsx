import { groupBy, map, uniq } from "lodash-es";
import { useMemo } from "react";

import {
  isNumberFiled,
  isNumeric,
  isTimeField,
  transformTimeData,
} from "~/utils/chart";

import { EChartsReact } from "./ReactEChartsCore";

export interface LineChartInfo {
  chartName: "LineChart";
  title: string;
  options: {
    x: string;
    y: string;
    pivot_column: string;
  };
}

function sortDataForXAxis(data: any[], x: string) {
  if (isNumberFiled(x) || data.map((i) => i[x]).every((j) => isNumeric(j))) {
    data.sort((a, b) => Number(a[x]) - Number(b[x]));
  }
  return data;
}

export const LineChart: React.FC<{
  chartInfo: LineChartInfo;
  className?: string;
  data: any[];
}> = ({ chartInfo, data, className }) => {
  const {
    options: { x, y },
    title,
  } = chartInfo;

  const chartOptions = useMemo(() => {
    let _data = sortDataForXAxis(data, x);
    const isTime = isTimeField(x);
    let source = isTime ? transformTimeData(_data, x) : _data;

    const xAxisLabels = uniq(map(source, x));

    const processPivotColumn = () => {
      const groups = groupBy(source, (v) => v[chartInfo.options.pivot_column]);
      const entries = Object.entries(groups);
      return entries.map(([key, value]) => {
        // align value with xAxisLabels
        const seriesData = xAxisLabels.map((axisLabel) => {
          const resultInValue = value.find((val) => val[x] === axisLabel);
          return resultInValue ? resultInValue[y] : null;
        });
        return {
          name: key,
          type: "line",
          data: seriesData,
          encode: {
            x,
            y,
          },
        };
      });
    };

    const makeSeries = (y: string | string[]): any => {
      if (typeof y === "string") {
        if (chartInfo.options.pivot_column) {
          return processPivotColumn();
        }
        return {
          type: "line",
          datasetId: "raw",
          name: y,
          encode: {
            x,
            y,
          },
          data: source.map((v) => v[y]),
        };
      } else {
        return y.map(makeSeries);
      }
    };
    const series = makeSeries(y);

    return {
      dataset: {
        id: "raw",
        source,
      },
      grid: {
        left: 8,
        right: 8,
        bottom: 8,
        top: 70,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
      },
      legend: {
        top: "30",
        type: "scroll",
        bottom: "50",
        orient: "horizontal",
      },
      series,
      title: {
        text: title,
      },
      xAxis: {
        type: isTime ? "time" : "category",
        data: xAxisLabels,
      },
      yAxis: {
        type: "value",
      },
      animationDuration: 2000,
    };
  }, [title, x, y, data, chartInfo.options.pivot_column]);

  return (
    <EChartsReact
      className={className}
      style={{
        height: 400,
      }}
      opts={{
        height: 400,
      }}
      option={chartOptions}
    />
  );
};
