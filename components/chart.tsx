import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { fetchAll } from "@/lib/db";
import { PlotData, Shape } from "plotly.js";

// Allowed timeframes: 1h, 1d, 1M
type Timeframe = "1h" | "1d" | "1M";

// Dynamically import Plotly to avoid SSR issues.
const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
);

interface DataItem {
  prod_id: string;
  tool_desc: string;
  tool_id: string;
  timestamp: Date;
  measurement_mm: number;
  time: Date;
}

interface AggregatedData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  average: number;
  upper: number;
  lower: number;
}

interface TimeSeriesChartProps {
  simulateLiveData?: boolean;
}

/**
 * Groups raw data into aggregated candles based on the chosen timeframe.
 * For "1h" and "1d", new ticks within the same hour/day are aggregated.
 */
const groupDataByTimeframe = (
  data: DataItem[],
  timeframe: Timeframe
): AggregatedData[] => {
  const grouped: { [key: string]: number[] } = {};

  // Determine the bucket key based on the timeframe.
  const getBucket = (timestamp: Date) => {
    const date = new Date(timestamp);
    if (timeframe === "1M") {
      // For monthly aggregation, set the day to 1 and reset time.
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else if (timeframe === "1d") {
      // For daily aggregation, reset the time.
      date.setHours(0, 0, 0, 0);
    } else if (timeframe === "1h") {
      // For hourly aggregation, reset minutes, seconds, and ms.
      date.setMinutes(0, 0, 0);
    }
    return date.toISOString();
  };

  data.forEach((item) => {
    const bucket = getBucket(item.timestamp);
    if (!grouped[bucket]) grouped[bucket] = [];
    grouped[bucket].push(item.measurement_mm);
  });

  return Object.entries(grouped)
    .map(([time, values]) => {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.map((v) => Math.pow(v - average, 2)).reduce((a, b) => a + b, 0) / values.length
      );
      return {
        time,
        open: values[0],
        high: Math.max(...values),
        low: Math.min(...values),
        close: values[values.length - 1],
        average,
        upper: average + stdDev,
        lower: average - stdDev,
      };
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  simulateLiveData = false,
}) => {
  // Default grouping is "1h"
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [data, setData] = useState<DataItem[]>([]);
  const [showBollingerBands, setShowBollingerBands] = useState<boolean>(false);
  const [showThreshold, setShowThreshold] = useState<boolean>(false);
  const [zoomRange, setZoomRange] = useState<[string, string] | undefined>(undefined);

  // Load all static data from the backend.
  useEffect(() => {
    const loadItems = async () => {
      try {
        const fetchedData = await fetchAll("measurement_dummy");
        const processedData = fetchedData.map((item: DataItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setData(processedData);
      } catch (error: any) {
        console.error(error.message);
      }
    };
    loadItems();
  }, []);

  // If live simulation is enabled, add a new random tick every second.
  useEffect(() => {
    if (!simulateLiveData) return;
    const interval = setInterval(() => {
      const newTick: DataItem = {
        prod_id: "sim",
        tool_desc: "Simulated Data",
        tool_id: "sim",
        timestamp: new Date(),
        measurement_mm: 180 + Math.random() * (200 - 180), // value between 180 and 200
        time: new Date(),
      };
      setData((prevData) => [...prevData, newTick]);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulateLiveData]);

  // Aggregate the data based on the selected timeframe.
  const aggregatedData = useMemo(() => {
    return groupDataByTimeframe(data, timeframe);
  }, [data, timeframe]);

  // Set the zoom range to the last 50 aggregated bars (if available).
  // In live simulation, if fewer than 50 aggregated candles exist,
  // the zoom range will cover all aggregated data.
  useEffect(() => {
    const getXRange = () => {
      if (aggregatedData.length >= 50) {
        return [
          aggregatedData[aggregatedData.length - 50].time,
          aggregatedData[aggregatedData.length - 1].time,
        ];
      } else if (aggregatedData.length > 0) {
        return [
          aggregatedData[0].time,
          aggregatedData[aggregatedData.length - 1].time,
        ];
      }
      return undefined;
    };
    setZoomRange(getXRange());
  }, [aggregatedData]);

  const getMinMaxThresholds = () => {
    const allMeasurements = data.map((d) => d.measurement_mm);
    return {
      min: Math.min(...allMeasurements),
      max: Math.max(...allMeasurements),
    };
  };
  const { min, max } = getMinMaxThresholds();

  // Remove gaps from the x-axis for a continuous view.
  const rangebreaks = [
    { pattern: "day of week", bounds: [6, 1] },
    { pattern: "hour", bounds: [17, 9] },
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            onClick={() => setShowBollingerBands((prev) => !prev)}
            className={`px-3 py-1 rounded border-2 border-gray-400 text-gray-400 mr-2 ${
              showBollingerBands ? "text-white bg-gray-400" : ""
            }`}
          >
            {showBollingerBands ? "Hide Bollinger Bands" : "Show Bollinger Bands"}
          </button>
          <button
            onClick={() => setShowThreshold((prev) => !prev)}
            className={`px-3 py-1 rounded border-2 border-gray-400 text-gray-400 ${
              showThreshold ? "text-white bg-gray-400" : ""
            }`}
          >
            {showThreshold ? "Hide Threshold" : "Show Threshold"}
          </button>
        </div>
        <div className="flex gap-2">
          {["1h", "1d", "1M"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as Timeframe)}
              className={`px-3 py-1 rounded border-2 border-sky-950 text-sky-950 ${
                timeframe === tf ? "text-white bg-sky-950" : ""
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-96">
        <Plot
          data={[
            {
              x: aggregatedData.map((d) => d.time),
              open: aggregatedData.map((d) => d.open),
              high: aggregatedData.map((d) => d.high),
              low: aggregatedData.map((d) => d.low),
              close: aggregatedData.map((d) => d.close),
              type: "candlestick",
              increasing: {
                line: { color: "rgb(239, 68, 68)" },
                fillcolor: "rgb(239, 68, 68)",
              },
              decreasing: {
                line: { color: "rgb(37, 99, 235)" },
                fillcolor: "rgb(37, 99, 235)",
              },
            },
            // Optionally add Bollinger Bands.
            ...(showBollingerBands
              ? [
                  {
                    x: aggregatedData.map((d) => d.time),
                    y: aggregatedData.map((d) => d.upper),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "rgba(0, 0, 0, 0.5)", width: 1 },
                    name: "Upper Band",
                  } as Partial<PlotData>,
                  {
                    x: aggregatedData.map((d) => d.time),
                    y: aggregatedData.map((d) => d.lower),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "rgba(0, 0, 0, 0.5)", width: 1 },
                    name: "Lower Band",
                  } as Partial<PlotData>,
                  {
                    x: aggregatedData
                      .map((d) => d.time)
                      .concat(aggregatedData.map((d) => d.time).reverse()),
                    y: aggregatedData
                      .map((d) => d.upper)
                      .concat(aggregatedData.map((d) => d.lower).reverse()),
                    type: "scatter",
                    fill: "toself",
                    fillcolor: "rgba(200, 200, 200, 0.3)",
                    line: { width: 0 },
                    name: "Bollinger Bands",
                    showlegend: false,
                  } as Partial<PlotData>,
                ]
              : []),
            {
              x: aggregatedData.map((d) => d.time),
              y: aggregatedData.map((d) => d.average),
              type: "scatter",
              mode: "lines",
              line: { color: "rgba(100, 100, 100, 0.8)", dash: "dot", width: 1 },
              name: "Average",
            },
          ]}
          layout={{
            xaxis: {
              type: "date",
              range: zoomRange, // Use the calculated zoom range
              rangeslider: { visible: false },
              rangebreaks: rangebreaks,
              tickfont: { size: 10 },
            },
            yaxis: { title: "Measurement (mm)" },
            shapes: [
				...(showThreshold
				  ? [
					  {
						type: "line",
						x0: aggregatedData[0].time,
						x1: aggregatedData[aggregatedData.length - 1].time,
						y0: 183,
						y1: 183,
						line: { color: "rgb(18, 42, 71)", width: 2, dash: "dash" },
					  },
					  {
						type: "line",
						x0: aggregatedData[0].time,
						x1: aggregatedData[aggregatedData.length - 1].time,
						y0: 193,
						y1: 193,
						line: { color: "rgb(18, 42, 71)", width: 2, dash: "dash" },
					  },
					]
				  : []),
			  ] as Partial<Shape>[],
			  height: 400,
  
          }}
          useResizeHandler={true}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default TimeSeriesChart;
