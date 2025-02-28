import type {Equipment} from "./types";

// Helper function to calculate months between dates
function monthsBetween(date1: Date, date2: Date): number {
	const months =
		(date2.getFullYear() - date1.getFullYear()) * 12 +
		(date2.getMonth() - date1.getMonth());
	return months;
}

// Generate sample data
const generateEquipmentData = (): Equipment[] => {
	const today = new Date();

	const equipmentList: Equipment[] = [
		{
			id: 1,
			description: "Digital Multimeter",
			brand: "Fluke",
			tag: "DMM-001",
			model: "87V",
			serialId: "FL87V-12345",
			range: "0-1000V",
			toleranceLimit: "±0.05%",
			inUse: true,
			calibrationInterval: 12,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth(),
				15
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth(),
				15
			).toISOString(),
			remainingMonths: 0,
			calibrationType: "External",
			reportNumber: "CAL-2023-0456",
			calibrator: "MetroCal Services",
			pic: "John Smith",
			renewalAction: "Email notification sent",
		},
		{
			id: 2,
			description: "Oscilloscope",
			brand: "Tektronix",
			tag: "OSC-002",
			model: "TDS2024C",
			serialId: "TK24C-67890",
			range: "200MHz",
			toleranceLimit: "±1%",
			inUse: true,
			calibrationInterval: 24,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth() - 6,
				10
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear() + 1,
				today.getMonth() - 6,
				10
			).toISOString(),
			remainingMonths: 18,
			calibrationType: "External",
			reportNumber: "CAL-2023-0789",
			calibrator: "PrecisionCal Inc.",
			pic: "Emily Johnson",
			renewalAction: "None required yet",
		},
		{
			id: 3,
			description: "Pressure Gauge",
			brand: "Ashcroft",
			tag: "PG-003",
			model: "1009",
			serialId: "AS1009-54321",
			range: "0-100 PSI",
			toleranceLimit: "±0.5%",
			inUse: true,
			calibrationInterval: 6,
			lastCalibration: new Date(
				today.getFullYear(),
				today.getMonth() - 5,
				5
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				5
			).toISOString(),
			remainingMonths: 1,
			calibrationType: "Internal",
			reportNumber: "INT-CAL-2023-112",
			calibrator: "Michael Chen",
			pic: "Sarah Williams",
			renewalAction: "Preliminary notification sent",
		},
		{
			id: 4,
			description: "Thermocouple",
			brand: "Omega",
			tag: "TC-004",
			model: "JMTSS-125U-6",
			serialId: "OM125-13579",
			range: "-200°C to 1250°C",
			toleranceLimit: "±1.1°C",
			inUse: true,
			calibrationInterval: 12,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth() + 1,
				20
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				20
			).toISOString(),
			remainingMonths: 1,
			calibrationType: "External",
			reportNumber: "CAL-2023-1234",
			calibrator: "ThermalCal Labs",
			pic: "David Rodriguez",
			renewalAction: "Calibration scheduled",
		},
		{
			id: 5,
			description: "Caliper",
			brand: "Mitutoyo",
			tag: "CAL-005",
			model: "500-196-30",
			serialId: "MT500-24680",
			range: "0-150mm",
			toleranceLimit: "±0.02mm",
			inUse: true,
			calibrationInterval: 12,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth() - 2,
				8
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth() - 2,
				8
			).toISOString(),
			remainingMonths: -2,
			calibrationType: "Internal",
			reportNumber: "INT-CAL-2023-078",
			calibrator: "Robert Kim",
			pic: "Jessica Martinez",
			renewalAction: "Urgent action required",
		},
		{
			id: 6,
			description: "pH Meter",
			brand: "Hanna",
			tag: "PHM-006",
			model: "HI98191",
			serialId: "HN981-97531",
			range: "0-14 pH",
			toleranceLimit: "±0.002 pH",
			inUse: false,
			calibrationInterval: 6,
			lastCalibration: new Date(
				today.getFullYear(),
				today.getMonth() - 3,
				12
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth() + 3,
				12
			).toISOString(),
			remainingMonths: 3,
			calibrationType: "External",
			reportNumber: "CAL-2023-5678",
			calibrator: "ChemCal Services",
			pic: "Thomas Wilson",
			renewalAction: "None required yet",
		},
		{
			id: 7,
			description: "Torque Wrench",
			brand: "Snap-on",
			tag: "TW-007",
			model: "ATECH3FR250",
			serialId: "SN250-86420",
			range: "50-250 Nm",
			toleranceLimit: "±4%",
			inUse: true,
			calibrationInterval: 12,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth() - 11,
				25
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				25
			).toISOString(),
			remainingMonths: 1,
			calibrationType: "External",
			reportNumber: "CAL-2023-9012",
			calibrator: "TorqueCal Specialists",
			pic: "Andrew Thompson",
			renewalAction: "Preliminary notification sent",
		},
		{
			id: 8,
			description: "Sound Level Meter",
			brand: "Extech",
			tag: "SLM-008",
			model: "407730",
			serialId: "EX407-75319",
			range: "40-130 dB",
			toleranceLimit: "±1.5 dB",
			inUse: true,
			calibrationInterval: 24,
			lastCalibration: new Date(
				today.getFullYear() - 1,
				today.getMonth() - 4,
				18
			).toISOString(),
			calibrationDue: new Date(
				today.getFullYear() + 1,
				today.getMonth() - 4,
				18
			).toISOString(),
			remainingMonths: 20,
			calibrationType: "External",
			reportNumber: "CAL-2023-3456",
			calibrator: "AcousticCal Inc.",
			pic: "Lisa Brown",
			renewalAction: "None required yet",
		},
	];

	// Calculate remaining months for each item
	return equipmentList.map((item) => {
		const dueDate = new Date(item.calibrationDue);
		const remainingMonths = monthsBetween(today, dueDate);
		return {
			...item,
			remainingMonths,
		};
	});
};

export const equipmentData = generateEquipmentData();
