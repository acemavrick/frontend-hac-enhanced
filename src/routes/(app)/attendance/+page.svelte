<script lang="ts">
	import type { PageData } from './$types';
	import DateRangeFilter from '$lib/components/filters/DateRangeFilter.svelte';
	import CalendarView from '$lib/components/attendance/CalendarView.svelte';
	import ListView from '$lib/components/attendance/ListView.svelte';
	import ChartView from '$lib/components/attendance/ChartView.svelte';

	let { data }: { data: PageData } = $props();

	type Tab = 'calendar' | 'list' | 'charts';
	let activeTab = $state<Tab>('calendar');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'calendar', label: 'Calendar' },
		{ id: 'list', label: 'List' },
		{ id: 'charts', label: 'Charts' }
	];

	// summary stats from current filter
	const summary = $derived(() => {
		const r = data.records;
		return {
			total: r.length,
			present: r.filter((x) => x.category === 'present').length,
			absent: r.filter((x) => x.category === 'absent').length,
			tardy: r.filter((x) => x.category === 'tardy').length
		};
	});
</script>

<svelte:head><title>Attendance - HAC Enhanced</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Attendance</h1>
		<p class="mt-1 text-sm text-gray-500">View and analyze your attendance records</p>
	</div>

	<!-- filter bar -->
	<DateRangeFilter />

	<!-- summary cards -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total Days</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{summary().total}</p>
		</div>
		<div class="rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-green-600">Present</p>
			<p class="mt-1 text-2xl font-bold text-green-700">{summary().present}</p>
		</div>
		<div class="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-red-600">Absent</p>
			<p class="mt-1 text-2xl font-bold text-red-700">{summary().absent}</p>
		</div>
		<div class="rounded-xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-yellow-600">Tardy</p>
			<p class="mt-1 text-2xl font-bold text-yellow-700">{summary().tardy}</p>
		</div>
	</div>

	<!-- tabs -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex gap-6">
			{#each tabs as tab}
				<button
					onclick={() => (activeTab = tab.id)}
					class="border-b-2 pb-3 text-sm font-medium transition
					{activeTab === tab.id
						? 'border-brand-500 text-brand-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- tab content -->
	{#if data.records.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
			</svg>
			<h3 class="mt-3 text-sm font-medium text-gray-900">No attendance data</h3>
			<p class="mt-1 text-sm text-gray-500">Submit a scrape order to get started</p>
			<a href="/orders" class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500">
				Go to orders
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</a>
		</div>
	{:else if activeTab === 'calendar'}
		<CalendarView records={data.records} />
	{:else if activeTab === 'list'}
		<ListView records={data.records} />
	{:else}
		<ChartView stats={data.stats} />
	{/if}
</div>
