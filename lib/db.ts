import supabase from "../lib/supabase";

// Define a generic type for any row data object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RowData = Record<string, any>;

// Fetch all rows from a table
export const fetchAll = async <T = RowData>(
	tableName: string
): Promise<T[]> => {
	const {data, error} = await supabase.from(tableName).select("*");

	if (error) {
		throw new Error(`Error fetching ${tableName}: ${error.message}`);
	}

	return data as T[];
};

// Fetch a row by ID (assuming "id" is the primary key column)
export const fetchById = async <T = RowData>(
	tableName: string,
	id: number | string
): Promise<T | null> => {
	const {data, error} = await supabase
		.from(tableName)
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		throw new Error(
			`Error fetching ${tableName} with id ${id}: ${error.message}`
		);
	}

	return data as T;
};

// Insert a new row
export const insertRow = async <T = RowData>(
	tableName: string,
	rowData: T
): Promise<T | null> => {
	const {data, error} = await supabase.from(tableName).insert([rowData]);

	if (error) {
		throw new Error(`Error inserting into ${tableName}: ${error.message}`);
	}

	return data ? (data[0] as T) : null;
};

// Update a row by ID
export const updateRow = async <T = RowData>(
	tableName: string,
	id: number | string,
	updates: Partial<T>
): Promise<T | null> => {
	const {data, error} = await supabase
		.from(tableName)
		.update(updates)
		.eq("id", id);

	if (error) {
		throw new Error(
			`Error updating ${tableName} with id ${id}: ${error.message}`
		);
	}

	return data ? (data[0] as T) : null;
};

// Delete a row by ID
export const deleteRow = async (
	tableName: string,
	id: number | string
): Promise<void> => {
	const {error} = await supabase.from(tableName).delete().eq("id", id);

	if (error) {
		throw new Error(
			`Error deleting ${tableName} with id ${id}: ${error.message}`
		);
	}
};
