<script lang="ts">
	import { toCSV, toJSON, downloadBlob, dateRangeSlug } from '$lib/export';
	import type { NormalizedRecord } from '$lib/types';

	let { records, notes = {} }: {
		records: NormalizedRecord[];
		notes?: Record<string, string>;
	} = $props();

	let open = $state(false);

	function exportCSV() {
		const slug = dateRangeSlug(records);
		downloadBlob(toCSV(records, notes), `${slug}.csv`, 'text/csv');
		open = false;
	}

	function exportJSON() {
		const slug = dateRangeSlug(records);
		downloadBlob(toJSON(records, notes), `${slug}.json`, 'application/json');
		open = false;
	}
</script>

<div class="relative">
	<button
		type="button"
		class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition hover:bg-surface-overlay"
		onclick={() => (open = !open)}
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
		</svg>
		Export
	</button>

	{#if open}
		<!-- backdrop -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-30" onclick={() => (open = false)}></div>

		<div class="absolute right-0 z-40 mt-1 w-48 rounded-lg border border-border bg-surface-raised py-1 shadow-lg">
			<button
				class="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-overlay"
				onclick={exportCSV}
			>
				Export CSV
			</button>
			<button
				class="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-overlay"
				onclick={exportJSON}
			>
				Export JSON
			</button>
		</div>
	{/if}
</div>
