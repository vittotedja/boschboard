import {CalendarClock, CalendarCheck, Calendar} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import type {Equipment} from "@/lib/types";
import {cn} from "@/lib/utils";

export function CalibrationTimeline({equipment}: {equipment: Equipment}) {
	const today = new Date();
	const lastCalibration = new Date(equipment.lastCalibration);
	const nextCalibration = new Date(equipment.calibrationDue);

	// Calculate percentage position for today marker (between last and next calibration)
	const totalDays =
		(nextCalibration.getTime() - lastCalibration.getTime()) /
		(1000 * 3600 * 24);
	const daysPassed =
		(today.getTime() - lastCalibration.getTime()) / (1000 * 3600 * 24);
	const percentComplete = Math.min(
		Math.max((daysPassed / totalDays) * 100, 0),
		100
	);

	// Calculate months remaining
	const monthsRemaining = equipment.remainingMonths;

	// Determine status color
	const getStatusColor = () => {
		if (monthsRemaining <= 0) return "bg-destructive";
		if (monthsRemaining <= 1) return "bg-yellow-400";
		return "bg-green-400";
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className={cn("w-3 h-3 rounded-full", getStatusColor())}></div>
					<span className="font-medium">
						{monthsRemaining <= 0
							? "Calibration Overdue"
							: monthsRemaining <= 1
							? "Calibration Due Soon"
							: "Calibration On Track"}
					</span>
				</div>
				<div className="text-sm text-muted-foreground">
					{monthsRemaining <= 0
						? "Action required immediately"
						: `${monthsRemaining} months remaining`}
				</div>
			</div>

			<div className="relative pt-6 pb-8">
				{/* Timeline bar */}
				<div className="absolute h-1.5 w-full bg-muted rounded-full overflow-hidden">
					<div
						className={cn("absolute h-full rounded-full", getStatusColor())}
						style={{width: `${percentComplete}%`}}
					></div>
				</div>

				{/* Last calibration marker */}
				<div className="absolute left-0 -top-1 flex flex-col items-center">
					<CalendarCheck className="h-6 w-6 text-primary mb-1" />
					{/* <div className="w-3 h-3 rounded-full bg-primary"></div> */}
					<span className="absolute top-10 left-1 text-xs whitespace-nowrap">
						Last: {formatDate(lastCalibration)}
					</span>
				</div>

				{/* Today marker */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className="absolute -top-1 flex flex-col items-center cursor-help"
								style={{
									left: `${percentComplete}%`,
									transform: "translateX(-50%)",
								}}
							>
								<Calendar className="h-6 w-6 text-primary mb-1" />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>Today: {formatDate(today)}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Next calibration marker */}
				<div className="absolute right-0 -top-1 flex flex-col items-center">
					<CalendarClock className="h-6 w-6 text-primary mb-1" />
					{/* <div className="w-3 h-3 rounded-full bg-primary"></div> */}
					<span className="absolute top-10 right-1 text-xs whitespace-nowrap">
						Due: {formatDate(nextCalibration)}
					</span>
				</div>
			</div>
		</div>
	);
}
