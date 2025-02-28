"use client";

import {useState, useEffect, useRef} from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {Slider} from "@/components/ui/slider";
import {Label} from "@/components/ui/label";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	ReferenceLine,
	Scatter,
} from "recharts";
import {Play, Pause, RefreshCw, AlertTriangle, AlertCircle} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

// Define the types for our data
interface Measurement {
	id: number;
	timestamp: Date;
	value: number;
	item: string;
	hasMeasurementError: boolean;
	hasItemError: boolean;
	isValid: boolean;
}

interface SimulationSettings {
	mean: number;
	stdDev: number;
	interval: number;
	isRunning: boolean;
	timeWindow: number;
	measurementErrorRate: number;
	measurementErrorMagnitude: number;
	itemErrorRate: number;
	itemErrorDuration: number;
	currentItemError: {
		active: boolean;
		remainingDuration: number;
	};
}

interface ScatterPropsType {
	cx: number;
	cy: number;
}

// List of items to choose from
const ITEMS = [
	{id: "temp", name: "Temperature (°C)"},
	{id: "pressure", name: "Pressure (kPa)"},
	{id: "humidity", name: "Humidity (%)"},
	{id: "flow", name: "Flow Rate (L/min)"},
	{id: "voltage", name: "Voltage (V)"},
];

// Function to generate normally distributed random numbers
function generateNormalRandom(mean: number, stdDev: number): number {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
	while (v === 0) v = Math.random();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	return mean + stdDev * z;
}

// Function to format date for display
function formatDate(date: Date): string {
	return date.toLocaleTimeString();
}

export default function SimulationPage() {
	// State for the selected item
	const [selectedItem, setSelectedItem] = useState(ITEMS[0].id);

	// State for measurements
	const [measurements, setMeasurements] = useState<Measurement[]>([]);

	// State for simulation settings
	const [settings, setSettings] = useState<SimulationSettings>({
		mean: 50,
		stdDev: 10,
		interval: 1000, // 1 second
		isRunning: false,
		timeWindow: 60, // 60 seconds
		measurementErrorRate: 0.1, // 10% chance of measurement error
		measurementErrorMagnitude: 3, // Multiplier for the standard deviation
		itemErrorRate: 0.05, // 5% chance of item error starting
		itemErrorDuration: 5, // Duration in seconds
		currentItemError: {
			active: false,
			remainingDuration: 0,
		},
	});

	// Ref for the interval
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Function to generate a new measurement
	const generateMeasurement = () => {
		// Check if we need to update item error state
		const currentItemError = {...settings.currentItemError};

		// If there's an active item error, decrement its duration
		if (currentItemError.active) {
			currentItemError.remainingDuration -= settings.interval / 1000;

			// If the error duration is over, clear the error
			if (currentItemError.remainingDuration <= 0) {
				currentItemError.active = false;
				currentItemError.remainingDuration = 0;
			}
		}
		// If there's no active error, check if a new one should start
		else if (Math.random() < settings.itemErrorRate) {
			currentItemError.active = true;
			currentItemError.remainingDuration = settings.itemErrorDuration;
		}

		// Update the item error state
		setSettings((prev) => ({
			...prev,
			currentItemError,
		}));

		// Determine if this measurement has a measurement error
		const hasMeasurementError = Math.random() < settings.measurementErrorRate;

		// Generate the base value
		let value: number;

		if (hasMeasurementError) {
			// For measurement errors, we use a larger standard deviation
			value = generateNormalRandom(
				settings.mean,
				settings.stdDev * settings.measurementErrorMagnitude
			);
		} else {
			value = generateNormalRandom(settings.mean, settings.stdDev);
		}

		// Create the measurement object
		const newMeasurement: Measurement = {
			id: Date.now(),
			timestamp: new Date(),
			value: Number.parseFloat(value.toFixed(2)),
			item: ITEMS.find((item) => item.id === selectedItem)?.name || "",
			hasMeasurementError,
			hasItemError: currentItemError.active,
			isValid: !currentItemError.active, // Item is invalid during item errors
		};

		setMeasurements((prev) => {
			// Keep only measurements within the time window
			const cutoffTime = new Date(Date.now() - settings.timeWindow * 1000);
			const filtered = [...prev, newMeasurement].filter(
				(m) => m.timestamp > cutoffTime
			);
			return filtered;
		});
	};

	// Start/stop the simulation
	const toggleSimulation = () => {
		setSettings((prev) => ({...prev, isRunning: !prev.isRunning}));
	};

	// Reset the simulation
	const resetSimulation = () => {
		setMeasurements([]);
		setSettings((prev) => ({
			...prev,
			isRunning: false,
			currentItemError: {
				active: false,
				remainingDuration: 0,
			},
		}));
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	// Update interval when settings change
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (settings.isRunning) {
			intervalRef.current = setInterval(generateMeasurement, settings.interval);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings.isRunning, settings.interval]); // Added generateMeasurement to dependencies

	// Calculate statistics
	const validMeasurements = measurements.filter((m) => m.isValid);
	const stats =
		validMeasurements.length > 0
			? {
					count: validMeasurements.length,
					min: Math.min(...validMeasurements.map((m) => m.value)),
					max: Math.max(...validMeasurements.map((m) => m.value)),
					avg:
						validMeasurements.reduce((sum, m) => sum + m.value, 0) /
						validMeasurements.length,
					measurementErrorCount: validMeasurements.filter(
						(m) => m.hasMeasurementError
					).length,
					itemErrorCount: measurements.filter((m) => m.hasItemError).length,
			  }
			: {
					count: 0,
					min: 0,
					max: 0,
					avg: 0,
					measurementErrorCount: 0,
					itemErrorCount: 0,
			  };

	// Prepare data for the distribution chart
	const prepareDistributionData = () => {
		if (validMeasurements.length === 0) return [];

		// Create bins for the histogram
		const min = Math.floor(stats.min);
		const max = Math.ceil(stats.max);
		const binSize = (max - min) / 10;
		const bins = Array.from({length: 10}, (_, i) => ({
			binStart: min + i * binSize,
			binEnd: min + (i + 1) * binSize,
			count: 0,
			errorCount: 0,
		}));

		// Count values in each bin
		validMeasurements.forEach((m) => {
			const binIndex = Math.min(
				Math.floor((m.value - min) / binSize),
				bins.length - 1
			);
			bins[binIndex].count++;
			if (m.hasMeasurementError) {
				bins[binIndex].errorCount++;
			}
		});

		return bins.map((bin) => ({
			range: `${bin.binStart.toFixed(1)}-${bin.binEnd.toFixed(1)}`,
			count: bin.count,
			errorCount: bin.errorCount,
		}));
	};

	// Prepare data for the time series chart
	const prepareTimeSeriesData = () => {
		return measurements.map((m) => ({
			time: formatDate(m.timestamp),
			value: m.isValid ? m.value : null,
			error: m.hasMeasurementError ? m.value : null,
			itemError: !m.isValid,
		}));
	};

	// Calculate error rates
	const errorRates = {
		measurementErrorRate:
			stats.count > 0
				? ((stats.measurementErrorCount / stats.count) * 100).toFixed(1)
				: "0.0",
		itemErrorRate:
			measurements.length > 0
				? ((stats.itemErrorCount / measurements.length) * 100).toFixed(1)
				: "0.0",
	};

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-6">Data Simulation Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				{/* Simulation Controls */}
				<Card>
					<CardHeader>
						<CardTitle>Simulation Controls</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic">
							<TabsList className="mb-4">
								<TabsTrigger value="basic">Basic Settings</TabsTrigger>
								<TabsTrigger value="errors">Error Settings</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="item-select">Select Item</Label>
									<Select value={selectedItem} onValueChange={setSelectedItem}>
										<SelectTrigger id="item-select">
											<SelectValue placeholder="Select an item" />
										</SelectTrigger>
										<SelectContent>
											{ITEMS.map((item) => (
												<SelectItem key={item.id} value={item.id}>
													{item.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="mean-input">
										Mean Value: {settings.mean}
									</Label>
									<Slider
										id="mean-input"
										min={0}
										max={100}
										step={1}
										value={[settings.mean]}
										onValueChange={([value]) =>
											setSettings((prev) => ({...prev, mean: value}))
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="stddev-input">
										Standard Deviation: {settings.stdDev}
									</Label>
									<Slider
										id="stddev-input"
										min={1}
										max={30}
										step={1}
										value={[settings.stdDev]}
										onValueChange={([value]) =>
											setSettings((prev) => ({...prev, stdDev: value}))
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="interval-input">
										Interval: {settings.interval / 1000}s
									</Label>
									<Slider
										id="interval-input"
										min={100}
										max={5000}
										step={100}
										value={[settings.interval]}
										onValueChange={([value]) =>
											setSettings((prev) => ({...prev, interval: value}))
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="timewindow-input">
										Time Window: {settings.timeWindow}s
									</Label>
									<Slider
										id="timewindow-input"
										min={10}
										max={300}
										step={10}
										value={[settings.timeWindow]}
										onValueChange={([value]) =>
											setSettings((prev) => ({...prev, timeWindow: value}))
										}
									/>
								</div>
							</TabsContent>

							<TabsContent value="errors" className="space-y-4">
								<div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
									<h3 className="font-medium flex items-center text-amber-800">
										<AlertCircle className="h-4 w-4 mr-2" />
										Error Simulation Settings
									</h3>
									<p className="text-sm text-amber-700 mt-1">
										Configure how frequently errors occur and their
										characteristics.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="measurement-error-rate">
										Measurement Error Rate:{" "}
										{(settings.measurementErrorRate * 100).toFixed(0)}%
									</Label>
									<Slider
										id="measurement-error-rate"
										min={0}
										max={1}
										step={0.01}
										value={[settings.measurementErrorRate]}
										onValueChange={([value]) =>
											setSettings((prev) => ({
												...prev,
												measurementErrorRate: value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Percentage of measurements that will have random errors
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="measurement-error-magnitude">
										Measurement Error Magnitude:{" "}
										{settings.measurementErrorMagnitude}x
									</Label>
									<Slider
										id="measurement-error-magnitude"
										min={1}
										max={10}
										step={0.5}
										value={[settings.measurementErrorMagnitude]}
										onValueChange={([value]) =>
											setSettings((prev) => ({
												...prev,
												measurementErrorMagnitude: value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										How much larger the standard deviation is for error
										measurements
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="item-error-rate">
										Item Error Rate: {(settings.itemErrorRate * 100).toFixed(0)}
										%
									</Label>
									<Slider
										id="item-error-rate"
										min={0}
										max={0.5}
										step={0.01}
										value={[settings.itemErrorRate]}
										onValueChange={([value]) =>
											setSettings((prev) => ({...prev, itemErrorRate: value}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Probability per second that the item will fail
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="item-error-duration">
										Item Error Duration: {settings.itemErrorDuration}s
									</Label>
									<Slider
										id="item-error-duration"
										min={1}
										max={30}
										step={1}
										value={[settings.itemErrorDuration]}
										onValueChange={([value]) =>
											setSettings((prev) => ({
												...prev,
												itemErrorDuration: value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										How long an item failure lasts in seconds
									</p>
								</div>

								{settings.currentItemError.active && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-md">
										<h3 className="font-medium flex items-center text-red-800">
											<AlertTriangle className="h-4 w-4 mr-2" />
											Item Error Active
										</h3>
										<p className="text-sm text-red-700 mt-1">
											Item failure will continue for{" "}
											{settings.currentItemError.remainingDuration.toFixed(1)}{" "}
											more seconds
										</p>
									</div>
								)}
							</TabsContent>
						</Tabs>

						<div className="flex items-center space-x-4 mt-6">
							<Button
								onClick={toggleSimulation}
								variant={settings.isRunning ? "destructive" : "default"}
							>
								{settings.isRunning ? (
									<>
										<Pause className="mr-2 h-4 w-4" /> Stop
									</>
								) : (
									<>
										<Play className="mr-2 h-4 w-4" /> Start
									</>
								)}
							</Button>

							<Button onClick={resetSimulation} variant="outline">
								<RefreshCw className="mr-2 h-4 w-4" /> Reset
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Statistics */}
				<Card>
					<CardHeader>
						<CardTitle>Statistics</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">
									Valid Measurements
								</p>
								<p className="text-2xl font-bold">{stats.count}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Average Value</p>
								<p className="text-2xl font-bold">{stats.avg.toFixed(2)}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Minimum Value</p>
								<p className="text-2xl font-bold">{stats.min.toFixed(2)}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Maximum Value</p>
								<p className="text-2xl font-bold">{stats.max.toFixed(2)}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
								<p className="text-sm text-yellow-800 font-medium">
									Measurement Errors
								</p>
								<p className="text-xl font-bold text-yellow-700">
									{stats.measurementErrorCount}{" "}
									<span className="text-sm font-normal">
										({errorRates.measurementErrorRate}%)
									</span>
								</p>
							</div>

							<div className="p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-800 font-medium">Item Errors</p>
								<p className="text-xl font-bold text-red-700">
									{stats.itemErrorCount}{" "}
									<span className="text-sm font-normal">
										({errorRates.itemErrorRate}%)
									</span>
								</p>
							</div>
						</div>

						{/* Distribution Chart */}
						<div className="mt-6 h-48">
							<h3 className="text-sm font-medium mb-2">Value Distribution</h3>
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={prepareDistributionData()}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="range" />
									<YAxis />
									<Tooltip />
									<Area
										type="monotone"
										dataKey="count"
										fill="rgba(99, 102, 241, 0.4)"
										stroke="rgb(99, 102, 241)"
									/>
									<Area
										type="monotone"
										dataKey="errorCount"
										fill="rgba(245, 158, 11, 0.4)"
										stroke="rgb(245, 158, 11)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Time Series Chart */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Measurements Over Time</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={prepareTimeSeriesData()}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="time" />
								<YAxis
									domain={[
										Math.floor(stats.min - settings.stdDev * 2),
										Math.ceil(stats.max + settings.stdDev * 2),
									]}
								/>
								<Tooltip
									formatter={(value, name) => {
										if (name === "value") return [value, "Value"];
										if (name === "error") return [value, "Measurement Error"];
										return [value, name];
									}}
								/>
								<Line
									type="monotone"
									dataKey="value"
									stroke="rgb(99, 102, 241)"
									dot={{r: 2}}
									activeDot={{r: 6}}
									connectNulls={false}
								/>
								<Scatter
									dataKey="error"
									fill="rgb(245, 158, 11)"
									shape={(props) => {
										const { cx, cy } = props as ScatterPropsType;
										return (
											<circle
												cx={cx}
												cy={cy}
												r={4}
												stroke="rgb(245, 158, 11)"
												strokeWidth={2}
												fill="rgb(245, 158, 11)"
											/>
										);
									}}
								/>
								{/* Add markers for item errors */}
								{prepareTimeSeriesData()
									.filter((d) => d.itemError)
									.map((d, i) => (
										<ReferenceLine
											key={i}
											x={d.time}
											stroke="rgb(220, 38, 38)"
											strokeWidth={2}
											strokeDasharray="3 3"
										/>
									))}
							</LineChart>
						</ResponsiveContainer>
					</div>
					<div className="flex flex-wrap gap-2 mt-4">
						<div className="flex items-center">
							<div className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></div>
							<span className="text-xs">Normal Value</span>
						</div>
						<div className="flex items-center">
							<div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
							<span className="text-xs">Measurement Error</span>
						</div>
						<div className="flex items-center">
							<div className="w-3 h-3 border-2 border-dashed border-red-500 mr-1"></div>
							<span className="text-xs">Item Error</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Measurements Table */}
			<Card>
				<CardHeader>
					<CardTitle>Measurement Log</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Timestamp</TableHead>
									<TableHead>Item</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Value</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{measurements.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="text-center text-muted-foreground"
										>
											No measurements yet. Start the simulation to generate
											data.
										</TableCell>
									</TableRow>
								) : (
									measurements
										.slice()
										.reverse()
										.slice(0, 10)
										.map((measurement) => (
											<TableRow
												key={measurement.id}
												className={!measurement.isValid ? "bg-red-50" : ""}
											>
												<TableCell>{measurement.id}</TableCell>
												<TableCell>
													{formatDate(measurement.timestamp)}
												</TableCell>
												<TableCell>{measurement.item}</TableCell>
												<TableCell>
													{!measurement.isValid ? (
														<Badge
															variant="destructive"
															className="flex items-center gap-1"
														>
															<AlertTriangle className="h-3 w-3" />
															Item Error
														</Badge>
													) : measurement.hasMeasurementError ? (
														<Badge
															variant="destructive"
															className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
														>
															<AlertCircle className="h-3 w-3" />
															Measurement Error
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="bg-green-100 text-green-800 hover:bg-green-100"
														>
															Valid
														</Badge>
													)}
												</TableCell>
												<TableCell
													className={`text-right font-mono ${
														measurement.hasMeasurementError
															? "text-amber-600 font-bold"
															: ""
													}`}
												>
													{measurement.isValid
														? measurement.value.toFixed(2)
														: "N/A"}
												</TableCell>
											</TableRow>
										))
								)}
							</TableBody>
						</Table>
					</div>
					{measurements.length > 10 && (
						<p className="text-sm text-muted-foreground mt-2">
							Showing 10 of {measurements.length} measurements
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
