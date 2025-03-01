"use client";

import {useEffect, useState} from "react";
import {Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {CalibrationTimeline} from "@/components/calibration-timeline";
import {EquipmentTable} from "@/components/equipment-table";
import type {Equipment} from "@/lib/types";
import {generateEquipmentData} from "@/lib/data"; // Import the function, not the variable!

export function CalibrationDashboard() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
		null
	);
	const [equipmentList, setEquipmentList] = useState<Equipment[]>([]); // Store equipment data

	// Fetch data on mount
	useEffect(() => {
		const fetchData = async () => {
			const data = await generateEquipmentData();
			setEquipmentList(data);
			setSelectedEquipment(data[0] || null); // Select first item if exists
		};

		fetchData();
	}, []);

	// Filtered equipment based on search
	const filteredEquipment = equipmentList.filter((item) => {
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
			{/* Search Input */}
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

			{/* Selected Equipment Section */}
			{selectedEquipment && (
				<div className="border rounded-lg p-6 bg-card">
					<h2 className="text-lg font-medium mb-4">
						{selectedEquipment.description} ({selectedEquipment.brand} -{" "}
						{selectedEquipment.model})
					</h2>
					<CalibrationTimeline equipment={selectedEquipment} />
				</div>
			)}

			{/* Equipment Table */}
			<EquipmentTable
				data={filteredEquipment}
				onRowClick={setSelectedEquipment}
				selectedId={selectedEquipment?.id}
			/>
		</div>
	);
}
