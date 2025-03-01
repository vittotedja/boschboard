"use client";

import React, {useState, useEffect, useRef} from "react";
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
	ReferenceLine,
} from "recharts";
import {Play, Pause, RefreshCw, AlertTriangle} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import TimeSeriesChart from "@/components/chart"; // Adjust the path if needed

import dynamic from "next/dynamic";
import type {Data} from "plotly.js";
const Plot = dynamic(
	() => import("react-plotly.js").then((mod) => mod.default),
	{
		ssr: false,
	}
);

// In your BayesianNoDriftSimulation component, add this new function before the return statement
const getCandlestickData = (data: MeasurementRecord[]): Data[] => {
	return [
		{
			x: data.map((d) => formatTime(d.timestamp)),
			open: data.map((d) => d.measuredX),
			high: data.map((d) => d.postMean + 2 * d.postStd),
			low: data.map((d) => d.postMean - 2 * d.postStd),
			close: data.map((d) => d.measuredX),
			type: "candlestick" as const,
			increasing: {line: {color: "#22c55e"}},
			decreasing: {line: {color: "#ef4444"}},
			name: "Measurement Range",
		},
		{
			x: data.map((d) => formatTime(d.timestamp)),
			y: data.map((d) => d.measuredX),
			type: "scatter" as const,
			mode: "lines",
			line: {color: "#4f46e5"},
			name: "Measured Value",
		},
		{
			x: data.map((d) => formatTime(d.timestamp)),
			y: data.map((d) => d.postMean),
			type: "scatter" as const,
			mode: "lines",
			line: {color: "#22c55e"},
			name: "Posterior Mean",
		},
	];
};

/* ------------------------------------------------------------------
 * 1) Helper Functions
 * ------------------------------------------------------------------ */

/** Generate a random value from N(mean, stdDev^2) */
function generateNormalRandom(mean: number, stdDev: number): number {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
	while (v === 0) v = Math.random();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	return mean + stdDev * z;
}

/**
 * Compute the posterior distribution for the true weight (Y) given
 * a measurement X, assuming:
 *    Y ~ Normal(priorMean, priorStd^2)
 *    X | Y ~ Normal(Y, measStd^2)
 *
 * Returns: { meanPost, stdPost }
 */
function computePosterior(
	measuredX: number,
	priorMean: number,
	priorStd: number,
	measStd: number
) {
	// Posterior variance:
	const varPost = 1 / (1 / priorStd ** 2 + 1 / measStd ** 2);
	const stdPost = Math.sqrt(varPost);

	// Posterior mean:
	const meanPost =
		varPost * (priorMean / priorStd ** 2 + measuredX / measStd ** 2);

	return {meanPost, stdPost};
}

/**
 * Quick approximation of the standard normal CDF.
 */
function standardNormalCDF(z: number): number {
	const t = 1 / (1 + 0.2315419 * Math.abs(z));
	const d = 0.3989423 * Math.exp((-z * z) / 2);
	let p =
		d *
		t *
		(0.3193815 +
			t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + 1.330274 * t))));
	if (z > 0) p = 1 - p;
	return p;
}

/** Compute P(L <= Y <= U) for Y ~ Normal(mean, std). */
function probInRange(mean: number, std: number, L: number, U: number) {
	const zL = (L - mean) / std;
	const zU = (U - mean) / std;
	return standardNormalCDF(zU) - standardNormalCDF(zL);
}

/** Format a Date object to a small time string (H:M:S) */
function formatTime(date: Date) {
	return date.toLocaleTimeString();
}

/* ------------------------------------------------------------------
 * 2) Types
 * ------------------------------------------------------------------ */

interface MeasurementRecord {
	id: number;
	timestamp: Date;

	/** True item weight */
	trueY: number;
	/** If forced out-of-spec => production error */
	hasProductionError: boolean;

	/** Observed measurement */
	measuredX: number;
	/** If used bigger noise => measurement error */
	hasMeasurementError: boolean;

	/** Bayesian posterior ignoring the above errors */
	postMean: number;
	postStd: number;
	pInSpec: number;
	flagged: boolean; // flagged out-of-spec if pInSpec < alpha
}

interface SimulationSettings {
	// Production
	productionMean: number;
	productionStd: number;

	// Measurement
	measurementStd: number;
	priorMean: number;
	priorStd: number;

	// Spec & Decision
	specLower: number;
	specUpper: number;
	alpha: number;

	// Additional error toggles
	measurementErrorRate: number;
	measurementErrorMagnitude: number;
	productionErrorRate: number;

	// Simulation control
	interval: number;
	timeWindow: number;
	isRunning: boolean;
}

/* ------------------------------------------------------------------
 * 3) Main React Component
 * ------------------------------------------------------------------ */

export default function BayesianNoDriftSimulation() {
	const [settings, setSettings] = useState<SimulationSettings>({
		// Production
		productionMean: 185,
		productionStd: 5,

		// Measurement
		measurementStd: 2,
		priorMean: 185,
		priorStd: 10,

		// Spec & Decision
		specLower: 180,
		specUpper: 195,
		alpha: 0.05,

		// Error toggles
		measurementErrorRate: 0.2,
		measurementErrorMagnitude: 3,
		productionErrorRate: 0.1,

		// Simulation control
		interval: 1000,
		timeWindow: 60,
		isRunning: false,
	});

	// The array of all measurements
	const [data, setData] = useState<MeasurementRecord[]>([]);
	const [simulateLiveData, setsimulateLiveData] = useState<boolean>(false);

	// Interval ref
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	/* -------------------------------
	 * Generate a new measurement
	 * ------------------------------- */
	const generateMeasurement = () => {
		// 1) Decide if production error
		let hasProductionError = false;
		let trueY = generateNormalRandom(
			settings.productionMean,
			settings.productionStd
		);
		if (Math.random() < settings.productionErrorRate) {
			// Force the item out-of-spec
			hasProductionError = true;
			if (Math.random() < 0.5) {
				trueY = settings.specLower - 5 - Math.abs(generateNormalRandom(0, 3));
			} else {
				trueY = settings.specUpper + 5 + Math.abs(generateNormalRandom(0, 3));
			}
		}

		// 2) Decide if measurement error => bigger noise
		let hasMeasurementError = false;
		let usedMeasStd = settings.measurementStd;
		if (Math.random() < settings.measurementErrorRate) {
			hasMeasurementError = true;
			usedMeasStd *= settings.measurementErrorMagnitude;
		}

		// 3) Observed measurement
		const measX = generateNormalRandom(trueY, usedMeasStd);

		// 4) Bayesian posterior ignoring the fact we had big noise / forced error
		const {meanPost, stdPost} = computePosterior(
			measX,
			settings.priorMean,
			settings.priorStd,
			settings.measurementStd
		);

		// 5) Probability in spec
		const pInSpec = probInRange(
			meanPost,
			stdPost,
			settings.specLower,
			settings.specUpper
		);

		const flagged = pInSpec < settings.alpha;

		// 6) Build record
		const record: MeasurementRecord = {
			id: Date.now(),
			timestamp: new Date(),
			trueY: Number(trueY.toFixed(2)),
			hasProductionError,
			measuredX: Number(measX.toFixed(2)),
			hasMeasurementError,
			postMean: Number(meanPost.toFixed(2)),
			postStd: Number(stdPost.toFixed(2)),
			pInSpec,
			flagged,
		};

		// 7) Update data
		const cutoff = Date.now() - settings.timeWindow * 1000;
		setData((prev) => {
			const arr = [...prev, record];
			return arr.filter((d) => d.timestamp.getTime() > cutoff);
		});
	};

	/* -------------------------------
	 * Simulation Start/Stop/Reset
	 * ------------------------------- */
	const toggleSimulation = () => {
		setSettings((prev) => ({...prev, isRunning: !prev.isRunning}));
		setsimulateLiveData(true)
	};

	const resetSimulation = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setSettings((prev) => ({...prev, isRunning: false}));
		setData([]);
		setsimulateLiveData(false)
	};

	/* -------------------------------
	 * Interval effect
	 * ------------------------------- */
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		if (settings.isRunning) {
			intervalRef.current = setInterval(generateMeasurement, settings.interval);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings.isRunning, settings.interval]);

	/* -------------------------------
	 * Derived Stats & Chart
	 * ------------------------------- */
	const count = data.length;
	const flaggedCount = data.filter((d) => d.flagged).length;

	// Flagged items that are truly production errors
	const flaggedProdErrorCount = data.filter(
		(d) => d.flagged && d.hasProductionError
	).length;

	// Flagged items that are measurement error only (no production error)
	const measErrorOnlyCount = data.filter(
		(d) => d.hasMeasurementError && !d.hasProductionError
	).length;

	const flaggedMeasErrorOnlyCount = data.filter(
		(d) => d.hasMeasurementError && !d.hasProductionError && d.flagged
	).length;

	const avgMeasured =
		count > 0 ? data.reduce((acc, d) => acc + d.measuredX, 0) / count : 0;
	const avgPosterior =
		count > 0 ? data.reduce((acc, d) => acc + d.postMean, 0) / count : 0;

	const minMeasured = count > 0 ? Math.min(...data.map((d) => d.measuredX)) : 0;
	const maxMeasured = count > 0 ? Math.max(...data.map((d) => d.measuredX)) : 0;

	const chartData = data.map((m) => ({
		time: formatTime(m.timestamp),
		measured: m.measuredX,
		postMean: m.postMean,
		flagged: m.flagged,
	}));

	/* -------------------------------
	 * Render
	 * ------------------------------- */
	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-6">Bayesian Simulation</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				{/* Left Column: Controls */}
				<Card>
					<CardHeader>
						<CardTitle>Simulation Controls</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="model">
							<TabsList className="mb-4">
								<TabsTrigger value="model">Model</TabsTrigger>
								<TabsTrigger value="spec">Spec/Decision</TabsTrigger>
								<TabsTrigger value="errors">Error Settings</TabsTrigger>
							</TabsList>

							{/* Model Tab */}
							<TabsContent value="model">
								<div className="my-4 space-y-1">
									<Label>Production Mean: {settings.productionMean}</Label>
									<p className="text-xs text-muted-foreground">
										Average size of production items
									</p>
									<Slider
										min={0}
										max={100}
										step={1}
										value={[settings.productionMean]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, productionMean: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>Production Std: {settings.productionStd}</Label>
									<p className="text-xs text-muted-foreground">
										The variance level of production items (Bigger value means
										bigger differences within all the items)
									</p>
									<Slider
										min={1}
										max={20}
										step={1}
										value={[settings.productionStd]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, productionStd: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>Measurement Std (τ): {settings.measurementStd}</Label>
									<p className="text-xs text-muted-foreground">
										(Bigger value means bigger differences between the true
										value and the measured value)
									</p>
									<Slider
										min={1}
										max={20}
										step={1}
										value={[settings.measurementStd]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, measurementStd: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>Prior Std (σ₀): {settings.priorStd}</Label>
									<p className="text-xs text-muted-foreground">
										How uncertain you are to the measurement (Higher σ₀ =
										measured value could be far from the true value)
									</p>
									<Slider
										min={1}
										max={30}
										step={1}
										value={[settings.priorStd]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, priorStd: val}))
										}
									/>
								</div>
							</TabsContent>

							{/* Spec/Decision Tab */}
							<TabsContent value="spec">
								<div className="my-4 space-y-1">
									<Label>Spec Lower (L): {settings.specLower}</Label>
									<p className="text-xs text-muted-foreground">
										Set standard of minimal value for the production
									</p>
									<Slider
										min={0}
										max={100}
										step={1}
										value={[settings.specLower]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, specLower: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>Spec Upper (U): {settings.specUpper}</Label>
									<p className="text-xs text-muted-foreground">
										Set standard of maximal value for the production
									</p>
									<Slider
										min={0}
										max={100}
										step={1}
										value={[settings.specUpper]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, specUpper: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>
										Out-of-Spec Threshold (α):{" "}
										{(settings.alpha * 100).toFixed(1)}%
									</Label>
									<p className="text-xs text-muted-foreground">
										Confidence in the decision to flag the item as out-of-spec
										(1 - α)
									</p>
									<Slider
										min={0.01}
										max={0.5}
										step={0.01}
										value={[settings.alpha]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, alpha: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>
										Measurement Interval: {settings.interval / 1000}s
									</Label>
									<p className="text-xs text-muted-foreground">
										Simulated range of time passed from each input of
										measurement
									</p>
									<Slider
										min={100}
										max={5000}
										step={100}
										value={[settings.interval]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, interval: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>Time Window: {settings.timeWindow}s</Label>
									<Slider
										min={10}
										max={300}
										step={10}
										value={[settings.timeWindow]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, timeWindow: val}))
										}
									/>
								</div>
							</TabsContent>

							{/* Error Settings Tab */}
							<TabsContent value="errors">
								<div className="my-4 space-y-1">
									<Label>
										Measurement Error Rate:{" "}
										{(settings.measurementErrorRate * 100).toFixed(0)}%
									</Label>
									<Slider
										min={0}
										max={1}
										step={0.05}
										value={[settings.measurementErrorRate]}
										onValueChange={([val]) =>
											setSettings((s) => ({...s, measurementErrorRate: val}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>
										Measurement Error Magnitude:{" "}
										{settings.measurementErrorMagnitude}×
									</Label>
									<Slider
										min={1}
										max={10}
										step={1}
										value={[settings.measurementErrorMagnitude]}
										onValueChange={([val]) =>
											setSettings((s) => ({
												...s,
												measurementErrorMagnitude: val,
											}))
										}
									/>
								</div>
								<div className="my-4 space-y-1">
									<Label>
										Production Error Rate:{" "}
										{(settings.productionErrorRate * 100).toFixed(0)}%
									</Label>
									<Slider
										min={0}
										max={1}
										step={0.05}
										value={[settings.productionErrorRate]}
										onValueChange={([val]) =>
											setSettings((s) => ({
												...s,
												productionErrorRate: val,
											}))
										}
									/>
								</div>
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

				{/* Right Column: Stats */}
				<Card>
					<CardHeader>
						<CardTitle>Statistics</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Count</p>
								<p className="text-2xl font-bold">{count}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Flagged</p>
								<p className="text-2xl font-bold">{flaggedCount}</p>
							</div>

							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Avg Measured</p>
								<p className="text-2xl font-bold">{avgMeasured.toFixed(2)}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">
									Avg Posterior Mean
								</p>
								<p className="text-2xl font-bold">{avgPosterior.toFixed(2)}</p>
							</div>

							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Min Measured</p>
								<p className="text-2xl font-bold">{minMeasured.toFixed(2)}</p>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Max Measured</p>
								<p className="text-2xl font-bold">{maxMeasured.toFixed(2)}</p>
							</div>
						</div>

						<div className="mt-4 space-y-2">
							<p className="text-sm text-muted-foreground">
								Flagged Production Errors
							</p>
							<p className="text-2xl font-bold">{flaggedProdErrorCount}</p>

							<p className="text-sm text-muted-foreground">
								Flagged Measurement-Error Only
							</p>
							<p className="text-2xl font-bold">{flaggedMeasErrorOnlyCount}</p>
							<p className="text-sm text-muted-foreground">
								Measurement-Error Only
							</p>
							<p className="text-2xl font-bold">{measErrorOnlyCount}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Time Series Chart */}
			{/* Time Series Chart */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Measurements Over Time</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[150, 200]} /> {/* Set the Y-Axis range from 150 to 200 */}
          <Tooltip />
          {/* Measured Value */}
          <Line
            type="monotone"
            dataKey="measured"
            stroke="#4f46e5"
            name="Measured (X)"
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
          />
          {/* Posterior Mean */}
          <Line
            type="monotone"
            dataKey="postMean"
            stroke="#22c55e"
            name="Posterior Mean"
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
          />
          {/* Reference lines for Spec Limits */}
          <ReferenceLine
            y={settings.specLower}
            stroke="#dc2626"
            strokeDasharray="3 3"
            label="Spec Lower"
          />
          <ReferenceLine
            y={settings.specUpper}
            stroke="#dc2626"
            strokeDasharray="3 3"
            label="Spec Upper"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap gap-2 mt-4 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-indigo-500" />
        <span>Measured Value</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span>Posterior Mean</span>
      </div>
      <div className="flex items-center gap-1 text-red-500">
        <AlertTriangle className="h-4 w-4" />
        <span>Spec Limits</span>
      </div>
    </div>
  </CardContent>
</Card>


			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Measurement Distribution Over Time</CardTitle>
				</CardHeader>
				<CardContent>
					<TimeSeriesChart simulateLiveData={simulateLiveData} />
				</CardContent>
			</Card>

			{/* Measurement Log Table */}
			<Card>
				<CardHeader>
					<CardTitle>
						Recent Measurements (Last {settings.timeWindow}s)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>T`rue Y</TableHead>
									<TableHead>Prod Error?</TableHead>
									<TableHead>Measured X</TableHead>
									<TableHead>Measure Error?</TableHead>
									<TableHead>Posterior Mean</TableHead>
									<TableHead>P(In Spec)</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={9}
											className="text-center text-muted-foreground"
										>
											No data yet. Start the simulation.
										</TableCell>
									</TableRow>
								) : (
									[...data]
										.reverse()
										.slice(0, 10)
										.map((m) => (
											<TableRow key={m.id}>
												<TableCell>{m.id}</TableCell>
												<TableCell>{formatTime(m.timestamp)}</TableCell>
												<TableCell className="font-mono text-right">
													{m.trueY.toFixed(2)}
												</TableCell>
												<TableCell>
													{m.hasProductionError ? (
														<Badge variant="destructive">Yes</Badge>
													) : (
														<Badge variant="outline">No</Badge>
													)}
												</TableCell>
												<TableCell className="font-mono text-right">
													{m.measuredX.toFixed(2)}
												</TableCell>
												<TableCell>
													{m.hasMeasurementError ? (
														<Badge
															variant="destructive"
															className="bg-amber-100 text-amber-800"
														>
															Yes
														</Badge>
													) : (
														<Badge variant="outline">No</Badge>
													)}
												</TableCell>
												<TableCell className="font-mono text-right">
													{m.postMean.toFixed(2)} ± {m.postStd.toFixed(2)}
												</TableCell>
												<TableCell className="font-mono text-right">
													{m.pInSpec.toFixed(3)}
												</TableCell>
												<TableCell>
													{m.flagged ? (
														<Badge variant="destructive">Out of Spec</Badge>
													) : (
														<Badge variant="outline">OK</Badge>
													)}
												</TableCell>
											</TableRow>
										))
								)}
							</TableBody>
						</Table>
					</div>
					{data.length > 10 && (
						<p className="text-sm text-muted-foreground mt-2">
							Showing last 10 of {data.length} measurements
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
