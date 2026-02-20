<script lang="ts">
	import { LayerCake, Svg, Html, flatten, stack } from 'layercake';
	import { scaleBand, scaleOrdinal } from 'd3-scale';

	import { CATEGORY_META, type CategoryId } from '$lib/categories';
	import { groupByDay, monthlyStats, computeInsights } from '$lib/attendance';
	import type { NormalizedRecord } from '$lib/types';

	import AxisX from '../charts/AxisX.svelte';
	import AxisY from '../charts/AxisY.svelte';
	import StackedBar from '../charts/StackedBar.svelte';
	import ChartTooltip from '../charts/ChartTooltip.svelte';

	let { records, colors }: {
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
	} = $props();

	const CATS: CategoryId[] = ['present', 'absent', 'tardy', 'excused', 'other'];

	const days = $derived(groupByDay(records));
	const stats = $derived(monthlyStats(days));
	const insights = $derived(computeInsights(days));

	// short month labels for x axis
	const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// transform stats into the shape d3-stack wants: array of objects with a label + numeric keys
	const chartData = $derived(stats.map(s => {
		const [, m] = s.key.split('-').map(Number);
		return {
			label: `${SHORT_MONTHS[m - 1]}`,
			present: s.present,
			absent: s.absent,
			tardy: s.tardy,
			excused: s.excused,
			other: s.other,
			_full: s.label // for tooltip
		};
	}));

	const stackedData = $derived(stack(chartData, CATS));
	const flatData = $derived(flatten(stackedData));

	const seriesColors = $derived(CATS.map(c => colors[c]));

	// tooltip state
	let tip = $state({ visible: false, x: 0, y: 0, lines: [] as { label: string; value: string; color: string }[] });

	function handleHover(e: MouseEvent, _si: number, d: any) {
		const data = d.data;
		tip = {
			visible: true,
			x: e.offsetX,
			y: e.offsetY,
			lines: CATS
				.filter(c => data[c] > 0)
				.map(c => ({
					label: CATEGORY_META[c].label,
					value: `${data[c]} day${data[c] > 1 ? 's' : ''}`,
					color: colors[c]
				}))
		};
	}
</script>

<div class="space-y-6">
	<!-- stacked column chart -->
	<div class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
		<h3 class="text-sm font-semibold text-text-secondary">Attendance by Month</h3>

		{#if stats.length === 0}
			<p class="mt-4 text-sm text-text-faint">No data to display</p>
		{:else}
			<div class="mt-4" style="height: 300px;">
				<LayerCake
					padding={{ top: 8, right: 8, bottom: 24, left: 32 }}
					x={(d: any) => d.data.label}
					y={[0, 1]}
					z="key"
					xScale={scaleBand().paddingInner(0.15).round(true)}
					xDomainSort={false}
					zScale={scaleOrdinal()}
					zDomain={CATS}
					zRange={seriesColors}
					{flatData}
					data={stackedData}
				>
					<Svg>
						<AxisY ticks={5} />
						<AxisX />
						<StackedBar
							onhover={handleHover}
							onleave={() => (tip.visible = false)}
						/>
					</Svg>
					<Html>
						<ChartTooltip
							x={tip.x}
							y={tip.y}
							visible={tip.visible}
							lines={tip.lines}
						/>
					</Html>
				</LayerCake>
			</div>

			<!-- legend -->
			<div class="mt-3 flex flex-wrap gap-4 text-xs">
				{#each CATS as cat}
					<div class="flex items-center gap-1.5">
						<span class="inline-block h-2.5 w-2.5 rounded-full" style="background-color: {colors[cat]}"></span>
						<span class="text-text-muted">{CATEGORY_META[cat].label}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- insights -->
	{#if insights.length > 0}
		<div class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
			<h3 class="text-sm font-semibold text-text-secondary">Insights</h3>
			<ul class="mt-3 space-y-2">
				{#each insights as insight}
					<li class="flex items-start gap-2 text-sm text-text-secondary">
						<span class="mt-0.5 text-text-faint">&bull;</span>
						{insight}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
