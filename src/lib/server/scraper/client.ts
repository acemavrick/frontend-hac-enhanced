import { env } from '$env/dynamic/private';

function baseUrl(): string {
	const url = env.SCRAPER_API_URL;
	if (!url) throw new Error('SCRAPER_API_URL is not set');
	return url.replace(/\/$/, '');
}

export type ScraperOrderResponse = {
	uid: string;
};

export type ScraperStatus = {
	status: 'processing' | 'done' | 'error';
	httpCode: number;
};

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

// poll scraper for order status
export async function getStatus(uid: string): Promise<ScraperStatus> {
	const res = await fetch(`${baseUrl()}/order/status?uid=${encodeURIComponent(uid)}`);

	if (res.status === 200) return { status: 'done', httpCode: 200 };
	if (res.status === 202) return { status: 'processing', httpCode: 202 };
	if (res.status === 404) throw new Error('Order not found on scraper');

	return { status: 'error', httpCode: res.status };
}

// download completed result from scraper
export async function downloadResult(hacUsername: string, uid: string): Promise<unknown> {
	const res = await fetch(
		`${baseUrl()}/download?uname=${encodeURIComponent(hacUsername)}&uid=${encodeURIComponent(uid)}`
	);

	if (!res.ok) {
		throw new Error(`Scraper download failed (${res.status})`);
	}

	return res.json();
}
