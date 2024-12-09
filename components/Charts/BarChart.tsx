import { groupBy, isUndefined, map, uniq } from "lodash-es";
import { useMemo } from "react";

import { EChartsReact } from "./ReactEChartsCore";

export interface BarChartInfo {
  chartName: "BarChart";
  title: string;
  options: {
    x: string;
    y: string;
    pivot_column: string;
  };
}

export const BarChart: React.FC<{
  chartInfo: BarChartInfo;
  className?: string;
  data: any[];
}> = ({ chartInfo, data, className }) => {
  const {
    title,
    options: { x, y },
  } = chartInfo;

  const { options, height } = useMemo(() => {
    const xAxisLabels = uniq(map(data, x));

    const processPivotColumn = () => {
      const groups = groupBy(data, (v) => v[chartInfo.options.pivot_column]);
      const entries = Object.entries(groups);
      return entries.map(([key, value]) => {
        const seriesData = xAxisLabels.map((axisLabel) => {
          const resultInValue = value.find((val) => val[x] === axisLabel);
          return resultInValue ? resultInValue[y] : null;
        });
        return {
          name: key,
          type: "bar",
          data: seriesData,
        };
      });
    };

    const makeSeries = (y: string | string[]): any => {
      if (chartInfo.options.pivot_column) {
        return processPivotColumn();
      }
      if (typeof y === "string") {
        let yAxisData = data.map((v) => v[y]);
        if (yAxisData.every((i) => isUndefined(i))) {
          const correctY = Object.keys(data.at(0)).find(
            (k) =>
              k.toLowerCase().includes(y.toLowerCase()) ||
              y.toLowerCase().includes(k.toLowerCase()),
          );

          if (correctY) {
            yAxisData = data.map((v) => v[correctY]);
          }
        }

        return {
          type: "bar",
          name: y,
          datasetId: "raw",
          data: yAxisData,
        };
      } else {
        return y.map(makeSeries);
      }
    };

    const series = makeSeries(y);

    return {
      options: {
        dataset: {
          id: "raw",
          source: data,
        },
        xAxis: {
          type: "category",
          data: xAxisLabels,
          axisLabel: {
            fontSize: 10,
            overflow: "break",
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            fontSize: 10,
            interval: 0,
            width: 100,
          },
        },
        legend: {
          top: "30",
          type: "scroll",
          bottom: "50",
          orient: "horizontal",
        },
        grid: {
          containLabel: true,
          top: 64,
          left: 10,
          right: 10,
          bottom: 10,
        },
        title: {
          text: title,
        },
        series,
        tooltip: {
          trigger: "axis",
        },
        animationDuration: 2000,
      },
      height: 400,
    };
  }, [data, x, y, chartInfo.options.pivot_column, title]);

  return (
    <EChartsReact
      className={className}
      style={{ height }}
      opts={{ height, renderer: "svg" }}
      option={options}
    />
  );
};
