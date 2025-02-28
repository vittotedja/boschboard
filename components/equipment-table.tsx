"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {MoreHorizontal, AlertCircle, CheckCircle, Clock} from "lucide-react";
import type {Equipment} from "@/lib/types";
import {cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";

interface EquipmentTableProps {
	data: Equipment[];
	onRowClick: (equipment: Equipment) => void;
	selectedId?: number;
}

export function EquipmentTable({
	data,
	onRowClick,
	selectedId,
}: EquipmentTableProps) {
	// const [visibleColumns, setVisibleColumns] = useState<string[]>([
	// 	"description",
	// 	"brand",
	// 	"tag",
	// 	"model",
	// 	"serialId",
	// 	"range",
	// 	"toleranceLimit",
	// 	"inUse",
	// 	"calibrationInterval",
	// 	"lastCalibration",
	// 	"calibrationDue",
	// 	"remainingMonths",
	// 	"calibrationType",
	// 	"reportNumber",
	// 	"calibrator",
	// 	"pic",
	// 	"actions",
	// ]);

	const visibleColumns = [
		"description",
		"brand",
		"tag",
		"model",
		"serialId",
		"range",
		"toleranceLimit",
		"inUse",
		"calibrationInterval",
		"lastCalibration",
		"calibrationDue",
		"remainingMonths",
		"calibrationType",
		"reportNumber",
		"calibrator",
		"pic",
		"actions",
	];

	const getStatusIndicator = (equipment: Equipment) => {
		const months = equipment.remainingMonths;

		if (months <= 0) {
			return (
				<div className="flex items-center gap-1.5">
					<AlertCircle className="h-4 w-4 text-destructive" />
					<span className="text-destructive font-medium">Overdue</span>
				</div>
			);
		} else if (months <= 1) {
			return (
				<div className="flex items-center gap-1.5">
					<Clock className="h-4 w-4 text-yellow-400" />
					<span className="text-yellow-400 font-medium">Due Soon</span>
				</div>
			);
		} else {
			return (
				<div className="flex items-center gap-1.5">
					<CheckCircle className="h-4 w-4 text-green-400" />
					<span className="text-green-400 font-medium">On Track</span>
				</div>
			);
		}
	};

	return (
		<div className="border rounded-lg">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							{visibleColumns.includes("description") && (
								<TableHead>Description</TableHead>
							)}
							{visibleColumns.includes("brand") && <TableHead>Brand</TableHead>}
							{visibleColumns.includes("tag") && <TableHead>Tag</TableHead>}
							{visibleColumns.includes("model") && (
								<TableHead>Model/Part No</TableHead>
							)}
							{visibleColumns.includes("serialId") && (
								<TableHead>Serial ID/No</TableHead>
							)}
							{visibleColumns.includes("range") && <TableHead>Range</TableHead>}
							{visibleColumns.includes("toleranceLimit") && (
								<TableHead>Tolerance Limit</TableHead>
							)}
							{visibleColumns.includes("inUse") && (
								<TableHead>In Use</TableHead>
							)}
							{visibleColumns.includes("calibrationInterval") && (
								<TableHead>Calibration Interval</TableHead>
							)}
							{visibleColumns.includes("lastCalibration") && (
								<TableHead>Last Calibration</TableHead>
							)}
							{visibleColumns.includes("calibrationDue") && (
								<TableHead>Calibration Due</TableHead>
							)}
							{visibleColumns.includes("remainingMonths") && (
								<TableHead>Remaining Months</TableHead>
							)}
							{visibleColumns.includes("calibrationType") && (
								<TableHead>Calibration Type</TableHead>
							)}
							{visibleColumns.includes("reportNumber") && (
								<TableHead>Report Number</TableHead>
							)}
							{visibleColumns.includes("calibrator") && (
								<TableHead>Calibrator</TableHead>
							)}
							{visibleColumns.includes("pic") && <TableHead>PIC</TableHead>}
							{visibleColumns.includes("actions") && (
								<TableHead className="w-[80px]">Actions</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={visibleColumns.length}
									className="h-24 text-center"
								>
									No equipment found.
								</TableCell>
							</TableRow>
						) : (
							data.map((equipment) => (
								<TableRow
									key={equipment.id}
									onClick={() => onRowClick(equipment)}
									className={cn(
										"cursor-pointer hover:bg-muted/50",
										selectedId === equipment.id && "bg-muted"
									)}
								>
									{visibleColumns.includes("description") && (
										<TableCell className="font-medium">
											<div className="flex flex-col">
												{equipment.description}
												<div className="md:hidden text-xs text-muted-foreground mt-1">
													{getStatusIndicator(equipment)}
												</div>
											</div>
										</TableCell>
									)}
									{visibleColumns.includes("brand") && (
										<TableCell>{equipment.brand}</TableCell>
									)}
									{visibleColumns.includes("tag") && (
										<TableCell>{equipment.tag}</TableCell>
									)}
									{visibleColumns.includes("model") && (
										<TableCell>{equipment.model}</TableCell>
									)}
									{visibleColumns.includes("serialId") && (
										<TableCell>{equipment.serialId}</TableCell>
									)}
									{visibleColumns.includes("range") && (
										<TableCell>{equipment.range}</TableCell>
									)}
									{visibleColumns.includes("toleranceLimit") && (
										<TableCell>{equipment.toleranceLimit}</TableCell>
									)}
									{visibleColumns.includes("inUse") && (
										<TableCell>
											<Badge variant={equipment.inUse ? "default" : "outline"}>
												{equipment.inUse ? "Yes" : "No"}
											</Badge>
										</TableCell>
									)}
									{visibleColumns.includes("calibrationInterval") && (
										<TableCell>
											{equipment.calibrationInterval} months
										</TableCell>
									)}
									{visibleColumns.includes("lastCalibration") && (
										<TableCell>
											{new Date(equipment.lastCalibration).toLocaleDateString()}
										</TableCell>
									)}
									{visibleColumns.includes("calibrationDue") && (
										<TableCell>
											{new Date(equipment.calibrationDue).toLocaleDateString()}
										</TableCell>
									)}
									{visibleColumns.includes("remainingMonths") && (
										<TableCell className="hidden md:table-cell">
											{getStatusIndicator(equipment)}
										</TableCell>
									)}
									{visibleColumns.includes("calibrationType") && (
										<TableCell>
											<Badge variant="outline">
												{equipment.calibrationType}
											</Badge>
										</TableCell>
									)}
									{visibleColumns.includes("reportNumber") && (
										<TableCell>{equipment.reportNumber}</TableCell>
									)}
									{visibleColumns.includes("calibrator") && (
										<TableCell>{equipment.calibrator}</TableCell>
									)}
									{visibleColumns.includes("pic") && (
										<TableCell>{equipment.pic}</TableCell>
									)}
									{visibleColumns.includes("actions") && (
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0"
														onClick={(e) => e.stopPropagation()}
													>
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<DropdownMenuItem>View details</DropdownMenuItem>
													<DropdownMenuItem>Edit equipment</DropdownMenuItem>
													<DropdownMenuItem>
														Record calibration
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem>Send reminder</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
