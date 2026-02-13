<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';

	let { orderId, initialProgress = 0 }: { orderId: string; initialProgress?: number } = $props();

	let progress = $state(initialProgress);
	let status = $state<'processing' | 'done' | 'error'>('processing');
	let errorMsg = $state('');

	// poll for status updates
	$effect(() => {
		if (status !== 'processing') return;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/scrape/${orderId}/status`);
				const data = await res.json();

				progress = data.progress ?? progress;
				status = data.status;

				if (data.status === 'done') {
					clearInterval(interval);
					// trigger download + normalization
					await fetch(`/api/scrape/${orderId}/download`);
					await invalidateAll();
				} else if (data.status === 'error') {
					clearInterval(interval);
					errorMsg = data.error ?? 'Scrape failed';
				}
			} catch {
				// network error — keep polling
			}
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<div>
	{#if status === 'processing'}
		<div class="space-y-2">
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-600">Processing...</span>
				<span class="font-medium text-brand-600">{Math.round(progress * 100)}%</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-gray-100">
				<div
					class="h-full rounded-full bg-brand-500 transition-all duration-700"
					style="width: {Math.round(progress * 100)}%"
				></div>
			</div>
		</div>
	{:else if status === 'done'}
		<div class="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
			Scrape complete — data has been saved
		</div>
	{:else}
		<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
			{errorMsg || 'Scrape failed'}
		</div>
	{/if}
</div>
