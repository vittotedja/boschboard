export interface Equipment {
	id: number;
	description: string;
	brand: string;
	tag: string;
	model: string;
	serialId: string;
	range: string;
	toleranceLimit: string;
	inUse: boolean;
	calibrationInterval: number; // in months
	lastCalibration: string; // date string
	calibrationDue: string; // date string
	remainingMonths: number;
	calibrationType: "Internal" | "External";
	reportNumber: string;
	calibrator: string;
	pic: string; // Person In Charge
	renewalAction: string;
}
