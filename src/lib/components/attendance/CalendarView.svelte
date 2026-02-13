<script lang="ts">
	import CalendarMonth from './CalendarMonth.svelte';

	type Record = { id: string; date: string; category: string; rawStatus: string; period: string | null; time: string | null; orderId: string };
	let { records }: { records: Record[] } = $props();

	// group records by year-month, figure out which months to show
	const months = $derived(() => {
		if (records.length === 0) return [];

		const byMonth = new Map<string, Record[]>();
		for (const r of records) {
			const key = r.date.slice(0, 7); // "2026-01"
			if (!byMonth.has(key)) byMonth.set(key, []);
			byMonth.get(key)!.push(r);
		}

		return [...byMonth.entries()]
			.sort((a, b) => b[0].localeCompare(a[0])) // newest first
			.map(([key, recs]) => {
				const [year, month] = key.split('-').map(Number);
				return { year, month, records: recs };
			});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
	{#each months() as m (m.year + '-' + m.month)}
		<CalendarMonth year={m.year} month={m.month} records={m.records} />
	{/each}
</div>
