<script lang="ts">
	import { goto } from '$app/navigation';

	let loading = $state(false);
	let error = $state('');

	async function startScrape() {
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/scrape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tasks: ['attendance'] })
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({ message: 'Request failed' }));
				throw new Error(data.message ?? `Error ${res.status}`);
			}

			const data = await res.json();
			await goto(`/orders/${data.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<button
		onclick={startScrape}
		disabled={loading}
		class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
	>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Submitting...
		{:else}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			New Scrape
		{/if}
	</button>

	{#if error}
		<p class="mt-2 text-sm text-red-600">{error}</p>
	{/if}
</div>
