<script lang="ts">
	import { CATEGORY_META, CATEGORY_IDS, type CategoryId } from '$lib/categories';
	import { groupByDay } from '$lib/attendance';
	import type { NormalizedRecord } from '$lib/types';

	type MonthBucket = {
		month: number;
		year: number;
		present: number;
		absent: number;
		tardy: number;
		excused: number;
		other: number;
		total: number;
	};

	let { records, colors }: {
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
	} = $props();

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// non-present categories shown in the stacked bar chart
	const BAR_CATS: CategoryId[] = ['absent', 'tardy', 'excused', 'other'];

	// group into days first, then aggregate by month
	const stats = $derived.by(() => {
		const days = groupByDay(records);
		const byMonth = new Map<string, MonthBucket>();
		for (const d of days) {
			const [y, m] = d.date.slice(0, 7).split('-').map(Number);
			const key = `${y}-${m}`;
			if (!byMonth.has(key)) {
				byMonth.set(key, { year: y, month: m, present: 0, absent: 0, tardy: 0, excused: 0, other: 0, total: 0 });
			}
			const entry = byMonth.get(key)!;
			entry.total += 1;
			entry[d.category] += 1;
		}
		return [...byMonth.values()].sort((a, b) => a.year - b.year || a.month - b.month);
	});

	const maxTotal = $derived(Math.max(...stats.map((s) => s.total), 1));

	function barHeight(value: number): number {
		return (value / maxTotal) * 160;
	}

	function monthLabel(s: MonthBucket): string {
		return `${monthNames[s.month - 1]} ${s.year}`;
	}

	const rates = $derived(
		stats.map((s) => ({
			label: monthLabel(s),
			rate: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0.0',
			present: s.present,
			total: s.total
		}))
	);
</script>

<div class="space-y-8">
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="text-sm font-semibold text-gray-700">Absences & Tardies by Month</h3>

		{#if stats.length === 0}
			<p class="mt-4 text-sm text-gray-400">No data to display</p>
		{:else}
			<div class="mt-4 flex items-end gap-2 overflow-x-auto pb-2" style="height: 220px">
				{#each stats as s (s.year + '-' + s.month)}
					<div class="flex min-w-[48px] flex-col items-center gap-1">
						<div class="flex flex-col-reverse" style="height: 180px">
							{#each BAR_CATS as cat}
								{#if s[cat] > 0}
									<div
										class="w-8 rounded-t transition-all duration-300"
										style="height: {barHeight(s[cat])}px; background-color: {colors[cat]}"
										title="{s[cat]} {CATEGORY_META[cat].label.toLowerCase()}"
									></div>
								{/if}
							{/each}
						</div>
						<span class="text-[10px] text-gray-500">{monthNames[s.month - 1]}</span>
					</div>
				{/each}
			</div>

			<div class="mt-3 flex flex-wrap gap-4 text-xs">
				{#each BAR_CATS as cat}
					<div class="flex items-center gap-1.5">
						<div class="h-2.5 w-2.5 rounded" style="background-color: {colors[cat]}"></div>
						<span class="text-gray-500">{CATEGORY_META[cat].label}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="text-sm font-semibold text-gray-700">Attendance Rate by Month</h3>

		{#if rates.length === 0}
			<p class="mt-4 text-sm text-gray-400">No data to display</p>
		{:else}
			<div class="mt-4 space-y-3">
				{#each rates as r (r.label)}
					<div class="flex items-center gap-3">
						<span class="w-20 text-xs text-gray-500">{r.label}</span>
						<div class="flex-1">
							<div class="h-2 overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: {r.rate}%; background-color: {parseFloat(r.rate) >= 95 ? colors.present : parseFloat(r.rate) >= 85 ? colors.tardy : colors.absent}"
								></div>
							</div>
						</div>
						<span class="w-14 text-right text-xs font-medium text-gray-700">{r.rate}%</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
