<script lang="ts">
	type MonthlyStats = {
		month: number;
		year: number;
		present: number;
		absent: number;
		tardy: number;
		other: number;
		total: number;
	};

	let { stats }: { stats: MonthlyStats[] } = $props();

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// compute max value for scaling
	const maxTotal = $derived(Math.max(...stats.map((s) => s.total), 1));

	function barHeight(value: number): number {
		return (value / maxTotal) * 160;
	}

	function monthLabel(s: MonthlyStats): string {
		return `${monthNames[s.month - 1]} ${s.year}`;
	}

	// attendance rate per month
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
	<!-- absences by month bar chart -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="text-sm font-semibold text-gray-700">Absences & Tardies by Month</h3>

		{#if stats.length === 0}
			<p class="mt-4 text-sm text-gray-400">No data to display</p>
		{:else}
			<div class="mt-4 flex items-end gap-2 overflow-x-auto pb-2" style="height: 220px">
				{#each stats as s (s.year + '-' + s.month)}
					<div class="flex min-w-[48px] flex-col items-center gap-1">
						<!-- stacked bar: absent + tardy -->
						<div class="flex flex-col-reverse" style="height: 180px">
							{#if s.absent > 0}
								<div
									class="w-8 rounded-t bg-red-400 transition-all duration-300"
									style="height: {barHeight(s.absent)}px"
									title="{s.absent} absent"
								></div>
							{/if}
							{#if s.tardy > 0}
								<div
									class="w-8 bg-yellow-400 transition-all duration-300"
									style="height: {barHeight(s.tardy)}px"
									title="{s.tardy} tardy"
								></div>
							{/if}
						</div>
						<span class="text-[10px] text-gray-500">{monthNames[s.month - 1]}</span>
					</div>
				{/each}
			</div>

			<div class="mt-3 flex gap-4 text-xs">
				<div class="flex items-center gap-1.5">
					<div class="h-2.5 w-2.5 rounded bg-red-400"></div>
					<span class="text-gray-500">Absent</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="h-2.5 w-2.5 rounded bg-yellow-400"></div>
					<span class="text-gray-500">Tardy</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- attendance rate -->
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
									class="h-full rounded-full transition-all duration-500
									{parseFloat(r.rate) >= 95 ? 'bg-green-500' : parseFloat(r.rate) >= 85 ? 'bg-yellow-500' : 'bg-red-500'}"
									style="width: {r.rate}%"
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
