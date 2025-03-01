import React, {useState, useMemo, useEffect} from "react";
import dynamic from "next/dynamic";
import {fetchAll} from "@/lib/db";
import {PlotData, Shape} from "plotly.js";

type Timeframe = "1m" | "5m" | "1h" | "1d" | "1M" | "tick"; // Added '1M' for "1 month"

// Only use dynamic import, remove the direct import
const Plot = dynamic(
	() => import("react-plotly.js").then((mod) => mod.default),
	{ssr: false}
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

const groupDataByTimeframe = (
	data: DataItem[],
	timeframe: Timeframe
): AggregatedData[] => {
	const grouped: {[key: string]: number[]} = {};

	const getBucket = (timestamp: Date) => {
		const date = new Date(timestamp);
		if (timeframe === "1m") date.setSeconds(0, 0);
		else if (timeframe === "5m")
			date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
		else if (timeframe === "1h") date.setMinutes(0, 0, 0);
		else if (timeframe === "1d") date.setHours(0, 0, 0, 0);
		return date.toISOString();
	};

	data.forEach((item) => {
		const bucket = getBucket(item.timestamp);
		if (!grouped[bucket]) grouped[bucket] = [];
		grouped[bucket].push(item.measurement_mm);
	});

	return Object.entries(grouped).map(([time, values]) => {
		const average = values.reduce((a, b) => a + b, 0) / values.length;
		const stdDev = Math.sqrt(
			values.map((v) => Math.pow(v - average, 2)).reduce((a, b) => a + b, 0) /
				values.length
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
	const [timeframe, setTimeframe] = useState<Timeframe>("tick");
	const [data, setData] = useState<DataItem[]>([]);
	const [showBollingerBands, setShowBollingerBands] = useState<boolean>(false);
	const [showThreshold, setShowThreshold] = useState<boolean>(false);

	useEffect(() => {
		const loadItems = async () => {
			try {
				const fetchedData = await fetchAll("measurement_dummy");
				const processedData = fetchedData.map((item: DataItem) => ({
					...item,
					timestamp: new Date(item.timestamp),
				}));
				setData(processedData);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				console.error(error.message);
			}
		};

		loadItems();
	}, []);

	const [initialRange, setInitialRange] = useState<[Date | null, Date | null]>([
		null,
		null,
	]);

	useEffect(() => {
		if (data.length > 0) {
			const allTimestamps = data.map((d) => d.timestamp);
			const latestTimestamp = allTimestamps[allTimestamps.length - 1];

			let startTimestamp: Date;
			switch (timeframe) {
				case "1m":
					startTimestamp = new Date(latestTimestamp.getTime() - 50 * 60 * 1000);
					break;
				case "5m":
					startTimestamp = new Date(
						latestTimestamp.getTime() - 50 * 5 * 60 * 1000
					);
					break;
				case "1h":
					startTimestamp = new Date(
						latestTimestamp.getTime() - 50 * 60 * 60 * 1000
					);
					break;
				case "1d":
					startTimestamp = new Date(
						latestTimestamp.getTime() - 50 * 24 * 60 * 60 * 1000
					);
					break;
				case "tick":
				default:
					startTimestamp = allTimestamps[allTimestamps.length - 50];
					break;
			}

			setInitialRange([startTimestamp, latestTimestamp]);
		}
	}, [data, timeframe]);

	const getXRange = () => {
		if (initialRange[0] && initialRange[1]) {
			return [initialRange[0].toISOString(), initialRange[1].toISOString()];
		}
		return undefined;
	};

	const aggregatedData = useMemo(() => {
		if (timeframe === "tick") return data; // Keep original data for "tick" timeframe
		return groupDataByTimeframe(data, timeframe); // Group by the selected timeframe otherwise
	}, [data, timeframe]);

	// Calculate the min and max threshold values for the y-axis
	const getMinMaxThresholds = () => {
		const allMeasurements = data.map((d) => d.measurement_mm);
		return {
			min: Math.min(...allMeasurements),
			max: Math.max(...allMeasurements),
		};
	};

	const {min, max} = getMinMaxThresholds();

	return (
		<div className="mb-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-lg font-bold">CandleStick Chart</h2>
				<div className="flex gap-2">
					{["tick", "1m", "5m", "1h", "1d"].map((tf) => (
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
			<button
				onClick={() => setShowBollingerBands((prev) => !prev)}
				className={`px-3 py-1 rounded border-2 border-gray-200 text-gray-200 mr-2 ${
					showBollingerBands ? "text-white bg-gray-200" : ""
				}`}
			>
				{showBollingerBands ? "Hide Bollinger Bands" : "Show Bollinger Bands"}
			</button>
			<button
				onClick={() => setShowThreshold((prev) => !prev)}
				className={`px-3 py-1 rounded border-2 border-gray-200 text-gray-200 ${
					showThreshold ? "text-white bg-gray-200" : ""
				}`}
			>
				{showThreshold ? "Hide Threshold" : "Show Threshold"}
			</button>

			<div className="h-96">
				{timeframe === "tick" ? (
					<Plot
						data={[
							{
								x: (aggregatedData as DataItem[]).map((d) => d.timestamp),
								y: (aggregatedData as DataItem[]).map((d) => d.measurement_mm),
								type: "scatter",
								mode: "lines",
								marker: {color: "rgb(37, 99, 235)"},
							},
						]}
						layout={{
							title: "Tick Chart",
							xaxis: {
								type: "date",
								range: getXRange(),
								rangeslider: {
									visible: false,
								},
							},
							yaxis: {title: "Value (mm)"},
							height: 400,
						}}
						useResizeHandler={true}
						style={{width: "100%"}}
					/>
				) : (
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
									line: {color: "rgb(239, 68, 68)"},
								},
								decreasing: {
									line: {color: "rgb(37, 99, 235)"},
								},
							},
							// Show Bollinger Bands only if `showBollingerBands` is true
							...(showBollingerBands
								? [
										{
											x: aggregatedData.map((d) => d.time),
											y: aggregatedData.map((d) => d.upper),
											type: "scatter",
											mode: "lines",
											line: {color: "rgba(0, 0, 0, 0.5)", width: 1},
											name: "Upper Band",
										} as Partial<PlotData>,
										{
											x: aggregatedData.map((d) => d.time),
											y: aggregatedData.map((d) => d.lower),
											type: "scatter",
											mode: "lines",
											line: {color: "rgba(0, 0, 0, 0.5)", width: 1},
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
											line: {width: 0},
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
								line: {
									color: "rgba(100, 100, 100, 0.8)",
									dash: "dot",
									width: 1,
								},
								name: "Average",
							},
						]}
						layout={{
							xaxis: {
								type: "date",
								range: getXRange(),
								rangeslider: {visible: false},
							},
							yaxis: {title: "Measurement (mm)"},
							shapes: [
								// Show Threshold lines only if `showThreshold` is true
								...(showThreshold
									? [
											{
												type: "line",
												x0: aggregatedData[0].time,
												x1: aggregatedData[aggregatedData.length - 1].time,
												y0: min,
												y1: min,
												line: {
													color: "rgb(18, 42, 71)",
													width: 2,
													dash: "dash",
												},
											},
											{
												type: "line",
												x0: aggregatedData[0].time,
												x1: aggregatedData[aggregatedData.length - 1].time,
												y0: max,
												y1: max,
												line: {
													color: "rgb(18, 42, 71)",
													width: 2,
													dash: "dash",
												},
											},
									  ]
									: []),
							] as Partial<Shape>[],
							height: 400,
						}}
						useResizeHandler={true}
						style={{width: "100%"}}
					/>
				)}
			</div>
		</div>
	);
};

export default TimeSeriesChart;
