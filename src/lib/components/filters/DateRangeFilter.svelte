<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let startDate = $state(page.url.searchParams.get('start') ?? '');
	let endDate = $state(page.url.searchParams.get('end') ?? '');
	let period = $state(page.url.searchParams.get('period') ?? '');

	type Preset = { label: string; start: string; end: string };

	function isoDate(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	// school year starts in August — figure out which year that is
	function schoolYearStart(): number {
		const now = new Date();
		return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
	}

	const presets: Preset[] = (() => {
		const now = new Date();
		const today = isoDate(now);
		const syStart = schoolYearStart();

		const weekAgo = new Date(now);
		weekAgo.setDate(weekAgo.getDate() - 7);

		const monthAgo = new Date(now);
		monthAgo.setMonth(monthAgo.getMonth() - 1);

		const sem1Start = new Date(syStart, 7, 1);
		const sem1End = new Date(syStart, 11, 31);
		const sem2Start = new Date(syStart + 1, 0, 1);
		const sem2End = new Date(syStart + 1, 4, 31);

		return [
			{ label: 'Week', start: isoDate(weekAgo), end: today },
			{ label: 'Month', start: isoDate(monthAgo), end: today },
			{ label: 'Sem 1', start: isoDate(sem1Start), end: isoDate(sem1End) },
			{ label: 'Sem 2', start: isoDate(sem2Start), end: isoDate(sem2End) },
			{ label: 'All', start: '', end: '' }
		];
	})();

	const periods = ['1', '2', '3', '4', '5', '6', '7'];

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
		if (period) params.set('period', period);
		else params.delete('period');
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each presets as preset}
		{@const active = startDate === preset.start && endDate === preset.end}
		<button
			onclick={() => applyFilter(preset.start, preset.end)}
			class="rounded-lg px-3 py-1.5 text-xs font-medium transition
			{active ? 'bg-brand-900/40 text-brand-300' : 'bg-surface-overlay text-text-secondary hover:bg-surface-overlay/80'}"
		>
			{preset.label}
		</button>
	{/each}

	<div class="flex items-center gap-1.5 text-xs">
		<input
			type="date"
			bind:value={startDate}
			onchange={updateUrl}
			class="rounded-md border-border bg-surface-raised px-2 py-1 text-xs text-text-primary shadow-sm focus:border-brand-500 focus:ring-brand-500"
		/>
		<span class="text-text-faint">to</span>
		<input
			type="date"
			bind:value={endDate}
			onchange={updateUrl}
			class="rounded-md border-border bg-surface-raised px-2 py-1 text-xs text-text-primary shadow-sm focus:border-brand-500 focus:ring-brand-500"
		/>
	</div>

	<select
		bind:value={period}
		onchange={updateUrl}
		class="rounded-lg border-border bg-surface-raised px-2 py-1.5 text-xs text-text-primary shadow-sm focus:border-brand-500 focus:ring-brand-500"
	>
		<option value="">All Periods</option>
		{#each periods as p}
			<option value={p}>Period {p}</option>
		{/each}
	</select>
</div>
