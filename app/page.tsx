"use client";

import {
	Bar,
	BarChart,
	// Line,
	// LineChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	PenToolIcon as Tool,
	AlertTriangle,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ErrorTrendGraph from "@/components/error-trend-graph";

// Sample data - replace with real data from your database
const calibrationData = [
	{month: "Jan", count: 65},
	{month: "Feb", count: 45},
	{month: "Mar", count: 72},
	{month: "Apr", count: 58},
	{month: "May", count: 80},
	{month: "Jun", count: 45},
];

const upcomingCalibrations = [
	{
		tool_desc: "Precision Caliper A",
		last_calibration: "2024-02-15",
		due_date: "2024-03-15",
		status: "Urgent",
	},
	{
		tool_desc: "Micrometer B",
		last_calibration: "2024-02-01",
		due_date: "2024-03-20",
		status: "Upcoming",
	},
	{
		tool_desc: "Gauge Block Set C",
		last_calibration: "2024-02-10",
		due_date: "2024-03-25",
		status: "Scheduled",
	},
	{
		tool_desc: "Digital Indicator D",
		last_calibration: "2024-01-20",
		due_date: "2024-03-10",
		status: "Overdue",
	},
];

export default function CalibrationDashboard() {
	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight text-sky-950">
					Dashboard
				</h2>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="border-sky-250">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-sky-950">
							Total Tools
						</CardTitle>
						<Tool className="h-4 w-4 text-sky-950" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-sky-950">245</div>
						<p className="text-xs text-gray-500">+12 from last month</p>
					</CardContent>
				</Card>
				<Card className="border-red-600">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-red-600">
							Needs Calibration
						</CardTitle>
						<AlertCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">12</div>
						<p className="text-xs text-gray-500">Due within 7 days</p>
					</CardContent>
				</Card>
				<Card className="border-sky-250">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-sky-950">
							Calibrated
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-sky-950" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-sky-950">189</div>
						<p className="text-xs text-gray-500">Last 30 days</p>
					</CardContent>
				</Card>
				<Card className="border-sky-250">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-sky-950">
							Average Error
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-sky-950" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-sky-950">0.11mm</div>
						<p className="text-xs text-gray-500">Within tolerance</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid gap-4">
				<ErrorTrendGraph />
			</div>
			<div className="grid gap-4">
				<Card className="border-sky-250">
					<CardHeader>
						<CardTitle className="text-sky-950">Calibration Activity</CardTitle>
						<CardDescription>Monthly calibration count</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={calibrationData}>
								<XAxis dataKey="month" />
								<YAxis />
								<Bar
									dataKey="count"
									fill="hsl(217.2 91.2% 59.8%)"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* Upcoming Calibrations Table */}
			<Card className="border-sky-250">
				<CardHeader>
					<CardTitle className="text-sky-950">Upcoming Calibrations</CardTitle>
					<CardDescription>Tools that need attention</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Tool Description</TableHead>
								<TableHead>Last Calibration</TableHead>
								<TableHead>Due Date</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{upcomingCalibrations.map((item) => (
								<TableRow key={item.tool_desc}>
									<TableCell>{item.tool_desc}</TableCell>
									<TableCell>{item.last_calibration}</TableCell>
									<TableCell>{item.due_date}</TableCell>
									<TableCell>
										<div
											className={`flex items-center gap-2 ${
												item.status === "Urgent" || item.status === "Overdue"
													? "text-red-600"
													: item.status === "Upcoming"
													? "text-sky-950"
													: "text-gray-500"
											}`}
										>
											<Clock className="h-4 w-4" />
											<span>{item.status}</span>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
