import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { fetchAll } from "@/lib/db";

type Timeframe = "5m" | "1h" | "1d" | "1M";  // Added '1M' for "1 month"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DataItem {
  prod_id: string;
  tool_desc: string;
  tool_id: string;
  timestamp: Date;
  measurement_mm: number;
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

const groupDataByTimeframe = (data: DataItem[], timeframe: Timeframe): AggregatedData[] => {
  const grouped: { [key: string]: number[] } = {};

  const getBucket = (timestamp: Date): string | null => {
    const date = new Date(timestamp);

    if (timeframe === "5m") {
      date.setSeconds(0, 0);
      date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
    } else if (timeframe === "1h") {
      const hour = date.getHours();
      if (hour < 9 || hour >= 18) return null; // Only show data between 9 AM - 6 PM
      date.setMinutes(0, 0, 0); // Group by hour
    } else if (timeframe === "1d") {
      const day = date.getDay();
      if (day === 0 || day === 6) return null; // Exclude weekends
      date.setHours(0, 0, 0, 0); // Group by day
    } else if (timeframe === "1M") {
      // Group by month
      date.setDate(1); // Set to the first day of the month
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  };

  data.forEach((item) => {
    const bucket = getBucket(item.timestamp);
    if (bucket) {
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item.measurement_mm);
    }
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([time, values]) => {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.map(v => Math.pow(v - average, 2)).reduce((a, b) => a + b, 0) / values.length
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
    });
};

const TimeSeriesChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [data, setData] = useState<DataItem[]>([]);
  const [showBollingerBands, setShowBollingerBands] = useState<boolean>(false);
  const [showThreshold, setShowThreshold] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(7); // Default to 7 days zoom for 5m data

  useEffect(() => {
    const loadItems = async () => {
      try {
        const fetchedData = await fetchAll("measurement_records");
        const processedData = fetchedData.map((item: any) => ({
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

  const aggregatedData = useMemo(() => {
    if (timeframe === "1d") {
      const filtered = data.filter(item => {
        const day = item.timestamp.getDay();
        return day !== 0 && day !== 6;
      });
      return groupDataByTimeframe(filtered, timeframe);
    } else if (timeframe === "1M") {
      return groupDataByTimeframe(data, timeframe); // For 1M, group by months
    }
    return groupDataByTimeframe(data, timeframe);
  }, [data, timeframe]);

  // For x-axis based on timeframe
  const xCategories = aggregatedData.map((_, index) => index);
  const tickText = aggregatedData.map(d => {
    const date = new Date(d.time);
    if (timeframe === "1d") {
      return date.toLocaleDateString();
    } else if (timeframe === "1h") {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === "1M") {
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' }); // Month Year (e.g., Mar 2025)
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  });

  // Zoom Level Logic: Adjust x-range for 5m data
  const xRange = [Math.max(0, xCategories.length - zoomLevel), xCategories.length - 1];

  const allMeasurements = data.map(d => d.measurement_mm);
  const yMin = Math.min(...allMeasurements);
  const yMax = Math.max(...allMeasurements);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Candlestick Chart</h2>
        <div className="flex gap-2">
          {(["5m", "1h", "1d", "1M"] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded border-2 border-sky-950 text-sky-950 ${timeframe === tf ? "text-white bg-sky-950" : ""}`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowBollingerBands(prev => !prev)}
        className={`px-3 py-1 rounded border-2 border-gray-200 text-gray-200 mr-2 ${showBollingerBands ? "text-white bg-gray-200" : ""}`}
      >
        {showBollingerBands ? "Hide Bollinger Bands" : "Show Bollinger Bands"}
      </button>
      <button
        onClick={() => setShowThreshold(prev => !prev)}
        className={`px-3 py-1 rounded border-2 border-gray-200 text-gray-200 ${showThreshold ? "text-white bg-gray-200" : ""}`}
      >
        {showThreshold ? "Hide Threshold" : "Show Threshold"}
      </button>
      <div className="h-96">
        <Plot
          data={[
            {
              x: xCategories,
              open: aggregatedData.map(d => d.open),
              high: aggregatedData.map(d => d.high),
              low: aggregatedData.map(d => d.low),
              close: aggregatedData.map(d => d.close),
              type: "candlestick",
              increasing: { fillcolor: "rgb(239, 68, 68)", line: { color: "rgb(239, 68, 68)" } },
              decreasing: { fillcolor: "rgb(37, 99, 235)", line: { color: "rgb(37, 99, 235)" } },
            },
            ...(showBollingerBands
              ? [
                  {
                    x: xCategories,
                    y: aggregatedData.map(d => d.upper),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "rgba(0,0,0,0.5)", width: 1 },
                    name: "Upper Band",
                  },
                  {
                    x: xCategories,
                    y: aggregatedData.map(d => d.lower),
                    type: "scatter",
                    mode: "lines",
                    line: { color: "rgba(0,0,0,0.5)", width: 1 },
                    name: "Lower Band",
                  },
                  {
                    x: xCategories.concat([...xCategories].reverse()),
                    y: aggregatedData.map(d => d.upper).concat(aggregatedData.map(d => d.lower).reverse()),
                    type: "scatter",
                    fill: "toself",
                    fillcolor: "rgba(200,200,200,0.3)",
                    line: { width: 0 },
                    name: "Bollinger Bands",
                    showlegend: false,
                  },
                ]
              : []),
            {
              x: xCategories,
              y: aggregatedData.map(d => d.average),
              type: "scatter",
              mode: "lines",
              line: { color: "rgba(100,100,100,0.8)", dash: "dot", width: 1 },
              name: "Average",
            },
          ]}
          layout={{
            xaxis: {
              type: "category",
              tickvals: xCategories,
              ticktext: tickText,
              range: xRange,
              rangeslider: {visible:false}
            },
            yaxis: {
              title: "Measurement (mm)",
              range: [yMin, yMax],
            },
            shapes: showThreshold
              ? [
                  {
                    type: "line",
                    x0: xCategories[0],
                    x1: xCategories[xCategories.length - 1],
                    y0: yMin,
                    y1: yMin,
                    line: { color: "rgb(18,42,71)", width: 2, dash: "dash" },
                  },
                  {
                    type: "line",
                    x0: xCategories[0],
                    x1: xCategories[xCategories.length - 1],
                    y0: yMax,
                    y1: yMax,
                    line: { color: "rgb(18,42,71)", width: 2, dash: "dash" },
                  },
                ]
              : [],
            height: 400,
          }}
          useResizeHandler
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default TimeSeriesChart;
