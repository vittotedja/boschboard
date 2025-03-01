"use client";

import {useEffect, useState} from "react";
import {Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {CalibrationTimeline} from "@/components/calibration-timeline";
import {EquipmentTable} from "@/components/equipment-table";
import type {Equipment} from "@/lib/types";
import {equipmentData} from "@/lib/data";

export function CalibrationDashboard() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
		null
	);

	useEffect(() => {
		setSelectedEquipment(equipmentData[0]);
	}, []);

	const filteredEquipment = equipmentData.filter((item) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			item.description.toLowerCase().includes(searchLower) ||
			item.brand.toLowerCase().includes(searchLower) ||
			item.model.toLowerCase().includes(searchLower) ||
			item.serialId.toLowerCase().includes(searchLower)
		);
	});

	return (
		<div className="container mx-auto py-6 space-y-8">
			<div className="relative">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search by description, brand, model or serial number..."
					className="pl-8 w-full md:w-[400px]"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{selectedEquipment && (
				<div className="border rounded-lg p-6 bg-card">
					<h2 className="text-lg font-medium mb-4">
						{selectedEquipment.description} ({selectedEquipment.brand} -{" "}
						{selectedEquipment.model})
					</h2>
					<CalibrationTimeline equipment={selectedEquipment} />
				</div>
			)}

			<EquipmentTable
				data={filteredEquipment}
				onRowClick={setSelectedEquipment}
				selectedId={selectedEquipment?.id}
			/>
		</div>
	);
}
