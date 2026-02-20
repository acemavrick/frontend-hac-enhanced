// shared types used across client and server

import type { CategoryId } from './categories';

export type AttendanceRecord = {
	id: string;
	date: string;
	rawStatus: string;
	category: string; // DB-stored default, not authoritative
	period: string | null;
	time: string | null;
	orderId: string;
};

// record with category resolved via user's map — produced by normalizeRecords()
export type NormalizedRecord = {
	id: string;
	date: string;
	rawStatus: string;
	category: CategoryId;
	period: string | null;
	time: string | null;
	orderId: string;
};

export type OrderSummary = {
	id: string;
	source: string;
	tasks: string[];
	status: string;
	progress: number;
	error: string | null;
	createdAt: number;
	completedAt: number | null;
};
