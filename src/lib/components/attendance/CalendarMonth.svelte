<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { categoryStyles, type CategoryId } from '$lib/categories';
	import { SEVERITY } from '$lib/attendance';
	import type { NormalizedRecord } from '$lib/types';
	import DayDetail from './DayDetail.svelte';

	let { year, month, records, colors, notes = {}, onnotechange }: {
		year: number; month: number;
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
		notes?: Record<string, string>;
		onnotechange?: (date: string, content: string) => void;
	} = $props();

	let hoveredDay = $state<number | null>(null);
	let selectedDay = $state<number | null>(null);
	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

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

	function dateStr(day: number): string {
		const mm = String(month).padStart(2, '0');
		const dd = String(day).padStart(2, '0');
		return `${year}-${mm}-${dd}`;
	}

	function recordsForDay(day: number): NormalizedRecord[] {
		return grid.find(c => c?.day === day)?.records ?? [];
	}

	function startHover(day: number) {
		if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
		hoveredDay = day;
	}

	function endHover() {
		hoverTimer = setTimeout(() => { hoveredDay = null; }, 200);
	}

	function cancelHoverClose() {
		if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
	}

	function handleClick(day: number) {
		// toggle click panel (closes hover)
		hoveredDay = null;
		selectedDay = selectedDay === day ? null : day;
	}
</script>

<div class="relative rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-text-secondary">{monthName}</h3>

	<div class="grid grid-cols-7 gap-px">
		{#each weekdays as dow (dow)}
			<div class="py-1 text-center text-[10px] font-medium uppercase text-text-faint">{dow}</div>
		{/each}

		{#each grid as cell, i (i)}
			{#if cell === null}
				<div></div>
			{:else}
				<!-- wrapper for relative positioning of tooltip -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative"
					onmouseenter={() => startHover(cell.day)}
					onmouseleave={endHover}
				>
					<button
						type="button"
						class="flex aspect-square w-full cursor-pointer items-center justify-center rounded-md border text-xs font-medium transition hover:ring-2 hover:ring-border"
						style={cellStyle(cell.records)}
						onclick={() => handleClick(cell.day)}
					>
						{cell.day}
					</button>

					<!-- note dot -->
					{#if notes[dateStr(cell.day)]}
						<span class="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-400"></span>
					{/if}

					<!-- hover tooltip -->
					{#if hoveredDay === cell.day && selectedDay !== cell.day}
						<DayDetail
							date={dateStr(cell.day)}
							records={cell.records}
							{colors}
							mode="hover"
							note={notes[dateStr(cell.day)] ?? ''}
							onclose={() => (hoveredDay = null)}
						/>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<!-- click-mode detail with notes -->
	{#if selectedDay !== null}
		<DayDetail
			date={dateStr(selectedDay)}
			records={recordsForDay(selectedDay)}
			{colors}
			mode="click"
			note={notes[dateStr(selectedDay)] ?? ''}
			onclose={() => (selectedDay = null)}
			{onnotechange}
		/>
	{/if}
</div>
