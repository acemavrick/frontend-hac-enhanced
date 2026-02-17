<script lang="ts">
	import { CATEGORY_META, categoryStyles, type CategoryId } from '$lib/categories';
	import { groupByDay } from '$lib/attendance';
	import type { NormalizedRecord } from '$lib/types';

	let { records, colors }: {
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
	} = $props();

	const days = $derived(groupByDay(records));

	function badgeStyle(cat: CategoryId): string {
		const s = categoryStyles(colors[cat] ?? colors.other);
		return `background-color: ${s.bg}; color: ${s.text};`;
	}

	function formatDate(iso: string): string {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
	<div class="divide-y divide-gray-100">
		{#each days as day (day.date)}
			<div class="px-5 py-3.5">
				<!-- day header -->
				<div class="flex items-center justify-between">
					<div class="text-sm font-medium text-gray-900">{formatDate(day.date)}</div>
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
						style={badgeStyle(day.category)}
					>
						{CATEGORY_META[day.category]?.label ?? day.category}
					</span>
				</div>

				<!-- period details -->
				{#if day.records.length > 1 || day.records[0]?.period}
					<div class="mt-2 ml-1 space-y-1 border-l-2 border-gray-100 pl-3">
						{#each day.records as record (record.id)}
							<div class="flex items-center gap-3 text-xs text-gray-500">
								{#if record.period}
									<span class="font-medium text-gray-600">P{record.period}</span>
								{/if}
								<span
									class="rounded px-1.5 py-0.5 text-xs font-medium"
									style={badgeStyle(record.category)}
								>
									{CATEGORY_META[record.category]?.label ?? record.category}
								</span>
								{#if record.time}
									<span>{record.time}</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
