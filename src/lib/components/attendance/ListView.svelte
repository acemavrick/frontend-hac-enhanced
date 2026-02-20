<script lang="ts">
	import { CATEGORY_META, categoryStyles, type CategoryId } from '$lib/categories';
	import { groupByDay } from '$lib/attendance';
	import type { NormalizedRecord } from '$lib/types';

	let { records, colors, notes = {} }: {
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
		notes?: Record<string, string>;
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

<div class="rounded-xl border border-border bg-surface-raised shadow-sm">
	<div class="divide-y divide-border-subtle">
		{#each days as day (day.date)}
			<div class="px-5 py-3.5">
				<!-- day header -->
				<div class="flex items-center justify-between">
					<div class="text-sm font-medium text-text-primary">{formatDate(day.date)}</div>
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
						style={badgeStyle(day.category)}
					>
						{CATEGORY_META[day.category]?.label ?? day.category}
					</span>
				</div>

				<!-- period details -->
				{#if day.records.length > 1 || day.records[0]?.period}
					<div class="mt-2 ml-1 space-y-1 border-l-2 border-border-subtle pl-3">
						{#each day.records as record (record.id)}
							<div class="flex items-center gap-3 text-xs text-text-muted">
								{#if record.period}
									<span class="font-medium text-text-secondary">P{record.period}</span>
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

				{#if notes[day.date]}
					<p class="mt-2 text-xs italic text-text-faint">{notes[day.date]}</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
