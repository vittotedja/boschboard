import {CalibrationDashboard} from "@/components/calibration-dashboard";

export default function CalibrationPage() {
	return (
		<div className="container mx-auto py-6 space-y-8">
			<div className="flex flex-col justify-between items-start space-y-4">
				<h1 className="text-2xl font-bold">Equipment Calibration Dashboard</h1>
				<p className="text-muted-foreground">
					Track and manage calibration schedules for all measuring equipment
				</p>
			</div>

			<CalibrationDashboard />
		</div>
	);
}
