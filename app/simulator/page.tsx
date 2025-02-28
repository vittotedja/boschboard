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
} from "recharts";
import {Play, Pause, RefreshCw} from "lucide-react";

// Define the types for our data
interface Measurement {
	id: number;
	timestamp: Date;
	value: number;
	item: string;
}

interface SimulationSettings {
	mean: number;
	stdDev: number;
	interval: number;
	isRunning: boolean;
	timeWindow: number;
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
	});

	// Ref for the interval
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Function to generate a new measurement
	const generateMeasurement = () => {
		const value = generateNormalRandom(settings.mean, settings.stdDev);
		const newMeasurement: Measurement = {
			id: Date.now(),
			timestamp: new Date(),
			value: Number.parseFloat(value.toFixed(2)),
			item: ITEMS.find((item) => item.id === selectedItem)?.name || "",
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
		setSettings((prev) => ({...prev, isRunning: false}));
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
	}, [settings.isRunning, settings.interval]); // Removed generateMeasurement from dependencies

	// Calculate statistics
	const stats =
		measurements.length > 0
			? {
					count: measurements.length,
					min: Math.min(...measurements.map((m) => m.value)),
					max: Math.max(...measurements.map((m) => m.value)),
					avg:
						measurements.reduce((sum, m) => sum + m.value, 0) /
						measurements.length,
			  }
			: {count: 0, min: 0, max: 0, avg: 0};

	// Prepare data for the distribution chart
	const prepareDistributionData = () => {
		if (measurements.length === 0) return [];

		// Create bins for the histogram
		const min = Math.floor(stats.min);
		const max = Math.ceil(stats.max);
		const binSize = (max - min) / 10;
		const bins = Array.from({length: 10}, (_, i) => ({
			binStart: min + i * binSize,
			binEnd: min + (i + 1) * binSize,
			count: 0,
		}));

		// Count values in each bin
		measurements.forEach((m) => {
			const binIndex = Math.min(
				Math.floor((m.value - min) / binSize),
				bins.length - 1
			);
			bins[binIndex].count++;
		});

		return bins.map((bin) => ({
			range: `${bin.binStart.toFixed(1)}-${bin.binEnd.toFixed(1)}`,
			count: bin.count,
		}));
	};

	// Prepare data for the time series chart
	const prepareTimeSeriesData = () => {
		return measurements.map((m) => ({
			time: formatDate(m.timestamp),
			value: m.value,
		}));
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
						<div className="space-y-4">
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
								<Label htmlFor="mean-input">Mean Value: {settings.mean}</Label>
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

							<div className="flex items-center space-x-4">
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
									Total Measurements
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
										Math.floor(stats.min - settings.stdDev),
										Math.ceil(stats.max + settings.stdDev),
									]}
								/>
								<Tooltip />
								<Line
									type="monotone"
									dataKey="value"
									stroke="rgb(99, 102, 241)"
									dot={{r: 2}}
									activeDot={{r: 6}}
								/>
							</LineChart>
						</ResponsiveContainer>
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
									<TableHead className="text-right">Value</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{measurements.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
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
											<TableRow key={measurement.id}>
												<TableCell>{measurement.id}</TableCell>
												<TableCell>
													{formatDate(measurement.timestamp)}
												</TableCell>
												<TableCell>{measurement.item}</TableCell>
												<TableCell className="text-right font-mono">
													{measurement.value.toFixed(2)}
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
