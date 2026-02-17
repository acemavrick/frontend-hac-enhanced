import { env } from '$env/dynamic/private';

function baseUrl(): string {
	const url = env.SCRAPER_API_URL;
	if (!url) throw new Error('SCRAPER_API_URL is not set');
	return url.replace(/\/$/, '');
}

export type ScraperOrderResponse = {
	uid: string;
};

// mirrors the scraper's OrderStatus enum
const TERMINAL_STATUSES = new Set(['complete', 'partial', 'failed', 'failed_auth', 'timed_out', 'canceled']);
const SUCCESS_STATUSES = new Set(['complete', 'partial']);

export type ScraperStatus = {
	uid: string;
	status: string;
	progress: number;
	error: string | null;
	subtasks: Record<string, { type: string; status: string; progress: number; error: string | null }>;
};

export function isTerminal(status: string): boolean {
	return TERMINAL_STATUSES.has(status);
}

export function isSuccess(status: string): boolean {
	return SUCCESS_STATUSES.has(status);
}

// submit a scrape order to the backend API
export async function submitOrder(
	hacUsername: string,
	hacPassword: string,
	tasks: string[]
): Promise<ScraperOrderResponse> {
	const res = await fetch(`${baseUrl()}/order/submit`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ u: hacUsername, p: hacPassword, t: tasks })
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Scraper submit failed (${res.status}): ${text}`);
	}

	return res.json();
}

// poll scraper for order status — returns the full status payload
export async function getStatus(uid: string): Promise<ScraperStatus> {
	const res = await fetch(`${baseUrl()}/order/status?uid=${encodeURIComponent(uid)}`);

	if (res.status === 404) throw new Error('Order not found on scraper');
	if (!res.ok) throw new Error(`Scraper status failed (${res.status})`);

	// the scraper always returns 200 with a JSON body containing the real status
	return res.json();
}

// download + decrypt completed result from scraper
export async function downloadResult(
	hacUsername: string,
	hacPassword: string,
	uid: string
): Promise<unknown> {
	const { decryptScraperOutput } = await import('./decrypt');

	const res = await fetch(
		`${baseUrl()}/download?uname=${encodeURIComponent(hacUsername)}&uid=${encodeURIComponent(uid)}`
	);

	if (!res.ok) {
		throw new Error(`Scraper download failed (${res.status})`);
	}

	const encrypted = Buffer.from(await res.arrayBuffer());
	const decrypted = decryptScraperOutput(hacPassword, encrypted);
	return JSON.parse(decrypted.toString('utf-8'));
}
