<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import CalendarMonth from './CalendarMonth.svelte';
	import type { NormalizedRecord } from '$lib/types';
	import type { CategoryId } from '$lib/categories';

	let { records, colors }: {
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
	} = $props();

	// group records by year-month
	const months = $derived.by(() => {
		if (records.length === 0) return [];

		const byMonth = new SvelteMap<string, NormalizedRecord[]>();
		for (const r of records) {
			const key = r.date.slice(0, 7);
			if (!byMonth.has(key)) byMonth.set(key, []);
			byMonth.get(key)!.push(r);
		}

		return [...byMonth.entries()]
			.sort((a, b) => b[0].localeCompare(a[0]))
			.map(([key, recs]) => {
				const [year, month] = key.split('-').map(Number);
				return { year, month, records: recs };
			});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
	{#each months as m (m.year + '-' + m.month)}
		<CalendarMonth year={m.year} month={m.month} records={m.records} {colors} />
	{/each}
</div>
