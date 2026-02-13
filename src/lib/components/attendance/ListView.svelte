<script lang="ts">
	type AttendanceRow = { id: string; date: string; category: string; rawStatus: string; period: string | null; time: string | null; orderId: string };
	let { records }: { records: AttendanceRow[] } = $props();

	const badgeColors: { [key: string]: string } = {
		present: 'bg-green-100 text-green-700',
		absent: 'bg-red-100 text-red-700',
		tardy: 'bg-yellow-100 text-yellow-700',
		other: 'bg-gray-100 text-gray-600'
	};

	function formatDate(iso: string): string {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
	<div class="divide-y divide-gray-100">
		{#each records as record (record.id)}
			<div class="flex items-center justify-between px-5 py-3.5">
				<div class="flex items-center gap-4">
					<div class="text-sm font-medium text-gray-900">{formatDate(record.date)}</div>
					{#if record.period}
						<span class="text-xs text-gray-400">Period {record.period}</span>
					{/if}
					{#if record.time}
						<span class="text-xs text-gray-400">{record.time}</span>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {badgeColors[record.category] ?? badgeColors.other}">
						{record.category}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>
