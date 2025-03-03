"use client";

import {useState, useEffect, useRef} from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {ArrowLeftIcon, ArrowRightIcon} from "lucide-react";
import supabase from "@/lib/supabase";

// Types for our data
interface ErrorData {
	timestamp: string;
	value: number;
	isPredicted?: boolean;
}

// Mock API function to get error data
const fetchErrorData = async (): Promise<ErrorData[]> => {
	// In a real app, this would be an API call
	const {data: measurementRecords} = await supabase
		.from("measurement_records")
		.select("*, products(size_mm)")
		.eq("prod_id", "BSH-00001")
		.order("timestamp", {ascending: false})
		.limit(10);

	const errorData = measurementRecords.map(
		(record: {
			timestamp: string;
			measurement_mm: number;
			products: {size_mm: number};
			isPredicted: boolean;
		}) => {
			return {
				timestamp: record.timestamp,
				value: record.measurement_mm - record.products.size_mm,
				isPredicted: false,
			};
		}
	);

	return errorData;
};

const predictNextError = async (
	previousData: ErrorData[]
): Promise<ErrorData> => {
	const response = await fetch(
		"https://web-dxupze9t2hv7.up-de-fra1-k8s-1.apps.run-on-seenode.com/predict",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				features: previousData.map((d) => d.value),
			}),
		}
	);

	const data = await response.json();

	const lastTimestamp = previousData[9].timestamp;
	// add 5 mins to the last timestamp
	const nextTimestamp = new Date(lastTimestamp);
	nextTimestamp.setMinutes(nextTimestamp.getMinutes() + 5);
	const result = {
		timestamp: nextTimestamp.toISOString(),
		value: data.prediction[0],
		isPredicted: true,
	};
	return result;
};

export default function ErrorTrendGraph() {
	const [errorData, setErrorData] = useState<ErrorData[]>([]);
	const [predictedData, setPredictedData] = useState<ErrorData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [viewMode, setViewMode] = useState<"all" | "scrollable">("all");
	const [visibleRange, setVisibleRange] = useState({start: 0, end: 10});

	const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Initial data load
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			try {
				const data = await fetchErrorData();
				setErrorData(data);

				// Generate initial predictions (3 future points)
				let currentPredictions = [...data];
				const predictions: ErrorData[] = [];

				for (let i = 0; i < 3; i++) {
					const nextPrediction = await predictNextError(currentPredictions);
					predictions.push(nextPrediction);
					currentPredictions = [...currentPredictions.slice(1), nextPrediction];
				}

				setPredictedData(predictions);
			} catch (error) {
				console.error("Failed to load error data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();

		return () => {
			if (autoUpdateIntervalRef.current) {
				// eslint-disable-next-line react-hooks/exhaustive-deps
				clearInterval(autoUpdateIntervalRef.current);
			}
		};
	}, []);

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Prepare data for chart
	const chartData = [...errorData, ...predictedData].flatMap(
		(item, index, arr) => {
			const isLastReal =
				!item.isPredicted &&
				(index === arr.length - 1 || arr[index + 1]?.isPredicted);

			return [
				{
					date: formatDate(item.timestamp),
					realError: item.isPredicted ? null : item.value,
					predictedError: item.isPredicted || isLastReal ? item.value : null,
				},
			];
		}
	);

	// Get visible data based on current mode and range
	const visibleData =
		viewMode === "all"
			? chartData
			: chartData.slice(visibleRange.start, visibleRange.end);

	// Navigation controls for scrollable view
	const scrollLeft = () => {
		if (visibleRange.start > 0) {
			setVisibleRange((prev) => ({
				start: prev.start - 1,
				end: prev.end - 1,
			}));
		}
	};

	const scrollRight = () => {
		if (visibleRange.end < chartData.length) {
			setVisibleRange((prev) => ({
				start: prev.start + 1,
				end: prev.end + 1,
			}));
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Error Trend</CardTitle>
				<CardDescription>Average calibration error over time</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-between mb-4">
					<Tabs
						defaultValue="all"
						onValueChange={(value) =>
							setViewMode(value as "all" | "scrollable")
						}
					>
						<TabsList>
							<TabsTrigger value="all">Show All</TabsTrigger>
							<TabsTrigger value="scrollable">Scrollable View</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="flex gap-2">
						{viewMode === "scrollable" && (
							<>
								<Button
									variant="outline"
									size="icon"
									onClick={scrollLeft}
									disabled={visibleRange.start <= 0}
								>
									<ArrowLeftIcon className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={scrollRight}
									disabled={visibleRange.end >= chartData.length}
								>
									<ArrowRightIcon className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center h-[400px]">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
					</div>
				) : (
					<div className="h-[400px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={visibleData}
								margin={{top: 5, right: 30, left: 20, bottom: 5}}
							>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tickFormatter={(value) => value} />
								<YAxis
									domain={[0, 0.18]}
									tickCount={7}
									tickFormatter={(value) => value.toFixed(2)}
								/>
								<Tooltip
									formatter={(value) => [
										Number(value).toFixed(4),
										"Error Value",
									]}
									labelFormatter={(label) => `Date: ${label}`}
								/>
								<Legend />

								{/* Real Error Line (Solid) */}
								<Line
									type="monotone"
									dataKey="realError"
									name="Real Error"
									stroke="#e11d48"
									activeDot={{r: 8}}
									strokeWidth={2}
									fill="#e11d48"
								/>

								{/* Predicted Error Line (Dashed) */}
								<Line
									type="monotone"
									dataKey="predictedError"
									name="Predicted Error"
									stroke="#9333ea"
									strokeDasharray="5 5"
									strokeWidth={2}
									fill="#9333ea"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}

				<div className="mt-4 text-sm text-gray-500">
					<p>
						Showing {visibleData.length} data points{" "}
						{viewMode === "scrollable"
							? `(${visibleRange.start + 1}-${visibleRange.end} of ${
									chartData.length
							  })`
							: ""}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
