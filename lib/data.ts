import supabase from "./supabase";
import type {Equipment} from "./types";

// Helper function to calculate months between dates
function monthsBetween(date1: Date, date2: Date): number {
	const months =
		(date2.getFullYear() - date1.getFullYear()) * 12 +
		(date2.getMonth() - date1.getMonth());

	console.log(months);
	return months;
}

function getNextDate(lastDate: string, intervalYears: number) {
	const nextDate = new Date(lastDate);
	nextDate.setFullYear(nextDate.getFullYear() + intervalYears);

	return nextDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

// Generate sample data
const generateEquipmentData = async (): Promise<Equipment[]> => {
	const {data: rawEquipmentData, error} = await supabase
		.from("tools")
		.select("*, calibration_records(*)");

	if (error) {
		throw new Error(`Error fetching equipment data: ${error.message}`);
	}

	//map rawEquipment to Equipment
	const newEquipmentList: Equipment[] = rawEquipmentData.map((item, index) => {
		const calibrationRecords = item.calibration_records[0];

		return {
			...item,
			id: index + 1,
			description: item.Description,
			brand: item.Brand,
			tag: item.Tag,
			model: item.Model_or_Part_No,
			serialId: item.Serial_or_Id_no,
			inUse: true,
			calibrationInterval: calibrationRecords.actual_calibration_interval,
			lastCalibration: new Date(calibrationRecords.last_calibration_date),
			calibrationDue: new Date(
				getNextDate(
					calibrationRecords.last_calibration_date,
					calibrationRecords.actual_calibration_interval
				)
			),
			remainingMonths: monthsBetween(
				new Date(),
				new Date(
					getNextDate(
						calibrationRecords.last_calibration_date,
						calibrationRecords.actual_calibration_interval
					)
				)
			),
			calibrationRecords,
			calibrationType: "External",
			reportNumber: "CAL-2023-0456",
			calibrator: "MetroCal Services",
			pic: "John Smith",
			renewalAction: "Email notification sent",
			calibrationError: calibrationRecords.Calibration_error,
		};
	});
	return newEquipmentList;
};

export const equipmentData = await generateEquipmentData();
