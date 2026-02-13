// shared types used across client and server

export type AttendanceCategory = 'present' | 'absent' | 'tardy' | 'other';

export type AttendanceRecord = {
	id: string;
	date: string;
	rawStatus: string;
	category: AttendanceCategory;
	period: string | null;
	time: string | null;
	orderId: string;
};

export type MonthlyStats = {
	month: number;
	year: number;
	present: number;
	absent: number;
	tardy: number;
	other: number;
	total: number;
};

export type OrderSummary = {
	id: string;
	tasks: string[];
	status: string;
	progress: number;
	error: string | null;
	createdAt: number;
	completedAt: number | null;
};
