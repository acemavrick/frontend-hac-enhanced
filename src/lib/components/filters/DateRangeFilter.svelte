<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let startDate = $state(page.url.searchParams.get('start') ?? '');
	let endDate = $state(page.url.searchParams.get('end') ?? '');

	type Preset = { label: string; start: string; end: string };

	function isoDate(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	const presets: Preset[] = (() => {
		const now = new Date();
		const today = isoDate(now);

		const weekAgo = new Date(now);
		weekAgo.setDate(weekAgo.getDate() - 7);

		const monthAgo = new Date(now);
		monthAgo.setMonth(monthAgo.getMonth() - 1);

		// rough semester: Aug-Dec or Jan-May
		const semStart = now.getMonth() >= 7
			? new Date(now.getFullYear(), 7, 1)
			: new Date(now.getFullYear(), 0, 1);

		const yearAgo = new Date(now);
		yearAgo.setFullYear(yearAgo.getFullYear() - 1);

		return [
			{ label: 'Week', start: isoDate(weekAgo), end: today },
			{ label: 'Month', start: isoDate(monthAgo), end: today },
			{ label: 'Semester', start: isoDate(semStart), end: today },
			{ label: 'Year', start: isoDate(yearAgo), end: today },
			{ label: 'All', start: '', end: '' }
		];
	})();

	function applyFilter(start: string, end: string) {
		startDate = start;
		endDate = end;
		updateUrl();
	}

	function updateUrl() {
		const params = new URLSearchParams(page.url.searchParams);
		if (startDate) params.set('start', startDate);
		else params.delete('start');
		if (endDate) params.set('end', endDate);
		else params.delete('end');
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each presets as preset}
		{@const active = startDate === preset.start && endDate === preset.end}
		<button
			onclick={() => applyFilter(preset.start, preset.end)}
			class="rounded-lg px-3 py-1.5 text-xs font-medium transition
			{active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
		>
			{preset.label}
		</button>
	{/each}

	<div class="flex items-center gap-1.5 text-xs">
		<input
			type="date"
			bind:value={startDate}
			onchange={updateUrl}
			class="rounded-md border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-brand-500 focus:ring-brand-500"
		/>
		<span class="text-gray-400">to</span>
		<input
			type="date"
			bind:value={endDate}
			onchange={updateUrl}
			class="rounded-md border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-brand-500 focus:ring-brand-500"
		/>
	</div>
</div>
