<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { orderId, initialProgress = 0 }: { orderId: string; initialProgress?: number } = $props();

	let progress = $state(initialProgress);
	let status = $state('processing');
	let errorMsg = $state('');
	let downloadError = $state('');

	// terminal failure states from the scraper
	const FAILED_STATUSES = new Set(['failed', 'failed_auth', 'timed_out', 'canceled']);
	const SUCCESS_STATUSES = new Set(['complete', 'partial']);

	function isActive(s: string): boolean {
		return !FAILED_STATUSES.has(s) && !SUCCESS_STATUSES.has(s);
	}

	// poll for status updates
	$effect(() => {
		if (!isActive(status)) return;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/scrape/${orderId}/status`);
				const data = await res.json();

				progress = data.progress ?? progress;
				status = data.status;

				if (SUCCESS_STATUSES.has(data.status)) {
					clearInterval(interval);
					// task succeeded — download and normalize
					try {
						const dl = await fetch(`/api/scrape/${orderId}/download`);
						if (!dl.ok) {
							const err = await dl.json().catch(() => ({ message: 'Download failed' }));
							downloadError = err.message ?? 'Download failed';
						}
					} catch {
						downloadError = 'Failed to download results';
					}
					await invalidateAll();
				} else if (FAILED_STATUSES.has(data.status)) {
					clearInterval(interval);
					errorMsg = data.error ?? `Scrape ${data.status.replace('_', ' ')}`;
				}
			} catch {
				// network error — keep polling
			}
		}, 3000);

		return () => clearInterval(interval);
	});

	// human-readable status label
	const statusLabel: Record<string, string> = {
		created: 'Starting...',
		queued: 'Queued...',
		authenticating: 'Logging in to HAC...',
		authenticated: 'Authenticated',
		scraping: 'Scraping data...',
		processing: 'Processing...'
	};
</script>

<div>
	{#if isActive(status)}
		<div class="space-y-2">
			<div class="flex items-center justify-between text-sm">
				<span class="text-text-secondary">{statusLabel[status] ?? 'Processing...'}</span>
				<span class="font-medium text-brand-400">{Math.round(progress * 100)}%</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-surface-overlay">
				<div
					class="h-full rounded-full bg-brand-500 transition-all duration-700"
					style="width: {Math.round(progress * 100)}%"
				></div>
			</div>
		</div>
	{:else if SUCCESS_STATUSES.has(status)}
		<div class="space-y-2">
			<div class="rounded-lg bg-green-900/30 px-4 py-3 text-sm text-green-400">
				Scrape complete — data has been saved
			</div>
			{#if downloadError}
				<div class="rounded-lg bg-yellow-900/30 px-4 py-3 text-sm text-yellow-400">
					Warning: {downloadError}
				</div>
			{/if}
		</div>
	{:else}
		<div class="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
			{errorMsg || 'Scrape failed'}
		</div>
	{/if}
</div>
