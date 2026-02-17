<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { categoryStyles, CATEGORY_META, type CategoryId } from '$lib/categories';
	import type { NormalizedRecord } from '$lib/types';

	let { year, month, records, colors }: {
		year: number; month: number;
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
	} = $props();

	const monthName = $derived(new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }));

	const grid = $derived.by(() => {
		const firstDay = new Date(year, month - 1, 1);
		const startDow = firstDay.getDay();
		const daysInMonth = new Date(year, month, 0).getDate();

		const byDay = new SvelteMap<number, NormalizedRecord[]>();
		for (const r of records) {
			const d = parseInt(r.date.split('-')[2], 10);
			if (!byDay.has(d)) byDay.set(d, []);
			byDay.get(d)!.push(r);
		}

		const cells: Array<{ day: number; records: NormalizedRecord[] } | null> = [];
		for (let i = 0; i < startDow; i++) cells.push(null);
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, records: byDay.get(d) ?? [] });
		}
		return cells;
	});

	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// priority: absent > tardy > excused > present > other
	const SEVERITY: CategoryId[] = ['absent', 'tardy', 'excused', 'present', 'other'];

	function worstCategory(dayRecords: NormalizedRecord[]): CategoryId | null {
		if (dayRecords.length === 0) return null;
		for (const cat of SEVERITY) {
			if (dayRecords.some((r) => r.category === cat)) return cat;
		}
		return 'other';
	}

	function cellStyle(dayRecords: NormalizedRecord[]): string {
		const cat = worstCategory(dayRecords);
		if (!cat) return 'border-color: transparent; color: #9ca3af;';
		const s = categoryStyles(colors[cat]);
		return `background-color: ${s.bg}; color: ${s.text}; border-color: ${s.border};`;
	}

	function tooltipLines(dayRecords: NormalizedRecord[]): string {
		if (dayRecords.length === 0) return 'Present';
		return dayRecords
			.map((r) => {
				const period = r.period ? `P${r.period}` : '';
				const label = CATEGORY_META[r.category]?.label ?? r.category;
				const time = r.time ?? '';
				return [period, label, time].filter(Boolean).join(' — ');
			})
			.join('\n');
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-gray-700">{monthName}</h3>

	<div class="grid grid-cols-7 gap-px">
		{#each weekdays as dow (dow)}
			<div class="py-1 text-center text-[10px] font-medium uppercase text-gray-400">{dow}</div>
		{/each}

		{#each grid as cell, i (i)}
			{#if cell === null}
				<div></div>
			{:else}
				<div
					class="flex aspect-square cursor-default items-center justify-center rounded-md border text-xs font-medium transition"
					style={cellStyle(cell.records)}
					title={tooltipLines(cell.records)}
				>
					{cell.day}
				</div>
			{/if}
		{/each}
	</div>
</div>
