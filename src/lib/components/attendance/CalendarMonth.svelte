<script lang="ts">
	type Record = { id: string; date: string; category: string; rawStatus: string; period: string | null; time: string | null; orderId: string };

	let { year, month, records }: { year: number; month: number; records: Record[] } = $props();

	const monthName = $derived(new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }));

	// build calendar grid — first day of month, number of days, etc.
	const grid = $derived(() => {
		const firstDay = new Date(year, month - 1, 1);
		const startDow = firstDay.getDay(); // 0=Sun
		const daysInMonth = new Date(year, month, 0).getDate();

		// map date string -> records for that day
		const byDay = new Map<number, Record[]>();
		for (const r of records) {
			const d = parseInt(r.date.split('-')[2], 10);
			if (!byDay.has(d)) byDay.set(d, []);
			byDay.get(d)!.push(r);
		}

		const cells: Array<{ day: number; records: Record[] } | null> = [];

		// padding for days before month starts
		for (let i = 0; i < startDow; i++) cells.push(null);

		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, records: byDay.get(d) ?? [] });
		}

		return cells;
	});

	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function categoryColor(records: Record[]): string {
		if (records.length === 0) return '';
		// priority: absent > tardy > present > other
		if (records.some((r) => r.category === 'absent')) return 'bg-red-100 text-red-800 border-red-200';
		if (records.some((r) => r.category === 'tardy')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		if (records.some((r) => r.category === 'present')) return 'bg-green-100 text-green-800 border-green-200';
		return 'bg-gray-100 text-gray-600 border-gray-200';
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-gray-700">{monthName}</h3>

	<div class="grid grid-cols-7 gap-px">
		{#each weekdays as dow}
			<div class="py-1 text-center text-[10px] font-medium uppercase text-gray-400">{dow}</div>
		{/each}

		{#each grid() as cell}
			{#if cell === null}
				<div></div>
			{:else}
				<div
					class="flex aspect-square items-center justify-center rounded-md border text-xs font-medium transition
					{cell.records.length > 0 ? categoryColor(cell.records) : 'border-transparent text-gray-400'}"
					title={cell.records.map((r) => r.rawStatus).join(', ') || `Day ${cell.day}`}
				>
					{cell.day}
				</div>
			{/if}
		{/each}
	</div>
</div>
