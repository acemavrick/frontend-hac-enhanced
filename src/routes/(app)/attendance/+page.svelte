<script lang="ts">
	import type { PageData } from './$types';
	import { groupByDay, daySummary } from '$lib/attendance';
	import { categoryStyles } from '$lib/categories';
	import DateRangeFilter from '$lib/components/filters/DateRangeFilter.svelte';
	import OrderSelector from '$lib/components/filters/OrderSelector.svelte';
	import CalendarView from '$lib/components/attendance/CalendarView.svelte';
	import ListView from '$lib/components/attendance/ListView.svelte';
	import ChartView from '$lib/components/attendance/ChartView.svelte';
	import ExportMenu from '$lib/components/attendance/ExportMenu.svelte';

	let { data }: { data: PageData } = $props();

	type Tab = 'calendar' | 'list' | 'charts';
	let activeTab = $state<Tab>('calendar');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'calendar', label: 'Calendar' },
		{ id: 'list', label: 'List' },
		{ id: 'charts', label: 'Charts' }
	];

	// records are already normalized by the loader
	const days = $derived(groupByDay(data.records));
	const summary = $derived(daySummary(days));
	const colors = $derived(data.categoryColors);
	let notes = $state<Record<string, string>>(data.notes ?? {});

	// keep notes in sync if page data reloads (e.g. filter change)
	$effect(() => { notes = data.notes ?? {}; });

	function handleNoteChange(date: string, content: string) {
		if (content) {
			notes[date] = content;
		} else {
			delete notes[date];
			// trigger reactivity by reassigning
			notes = { ...notes };
		}
	}

	// inline styles for the summary cards
	const presentStyle = $derived(categoryStyles(colors.present));
	const absentStyle = $derived(categoryStyles(colors.absent));
	const tardyStyle = $derived(categoryStyles(colors.tardy));
	const excusedStyle = $derived(categoryStyles(colors.excused));
	const otherStyle = $derived(categoryStyles(colors.other));
</script>

<svelte:head><title>Attendance - HAC Enhanced</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-text-primary">Attendance</h1>
			<p class="mt-1 text-sm text-text-muted">View and analyze your attendance records</p>
		</div>
		{#if data.records.length > 0}
			<ExportMenu records={data.records} {notes} />
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<DateRangeFilter />
		{#if data.completedOrders.length > 1}
			<div class="h-5 w-px bg-border"></div>
			<OrderSelector orders={data.completedOrders} selectedIds={data.selectedOrderIds} />
		{/if}
		{#if data.selectedOrderIds.length > 1}
			<span class="rounded-md bg-surface-overlay px-2 py-1 text-[10px] text-text-faint">
				Merged from {data.selectedOrderIds.length} orders
			</span>
		{/if}
	</div>

	<!-- summary cards -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		<div class="rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-text-muted">Total Days</p>
			<p class="mt-1 text-2xl font-bold text-text-primary">{summary.total}</p>
		</div>
		<div class="rounded-xl p-4 shadow-sm" style="background-color: {presentStyle.bg}; border: 1px solid {presentStyle.border}">
			<p class="text-xs font-medium uppercase tracking-wide" style="color: {presentStyle.text}">Present</p>
			<p class="mt-1 text-2xl font-bold" style="color: {presentStyle.text}">{summary.present}</p>
		</div>
		<div class="rounded-xl p-4 shadow-sm" style="background-color: {absentStyle.bg}; border: 1px solid {absentStyle.border}">
			<p class="text-xs font-medium uppercase tracking-wide" style="color: {absentStyle.text}">Absent</p>
			<p class="mt-1 text-2xl font-bold" style="color: {absentStyle.text}">{summary.absent}</p>
		</div>
		<div class="rounded-xl p-4 shadow-sm" style="background-color: {tardyStyle.bg}; border: 1px solid {tardyStyle.border}">
			<p class="text-xs font-medium uppercase tracking-wide" style="color: {tardyStyle.text}">Tardy</p>
			<p class="mt-1 text-2xl font-bold" style="color: {tardyStyle.text}">{summary.tardy}</p>
		</div>
		<div class="rounded-xl p-4 shadow-sm" style="background-color: {excusedStyle.bg}; border: 1px solid {excusedStyle.border}">
			<p class="text-xs font-medium uppercase tracking-wide" style="color: {excusedStyle.text}">Excused</p>
			<p class="mt-1 text-2xl font-bold" style="color: {excusedStyle.text}">{summary.excused}</p>
		</div>
		<div class="rounded-xl p-4 shadow-sm" style="background-color: {otherStyle.bg}; border: 1px solid {otherStyle.border}">
			<p class="text-xs font-medium uppercase tracking-wide" style="color: {otherStyle.text}">Other</p>
			<p class="mt-1 text-2xl font-bold" style="color: {otherStyle.text}">{summary.other}</p>
		</div>
	</div>

	<!-- tabs -->
	<div class="border-b border-border">
		<nav class="-mb-px flex gap-6">
			{#each tabs as tab}
				<button
					onclick={() => (activeTab = tab.id)}
					class="border-b-2 pb-3 text-sm font-medium transition
					{activeTab === tab.id
						? 'border-brand-500 text-brand-400'
						: 'border-transparent text-text-muted hover:border-border hover:text-text-primary'}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- tab content -->
	{#if data.records.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-surface-raised p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-text-faint" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
			</svg>
			<h3 class="mt-3 text-sm font-medium text-text-primary">No attendance data</h3>
			<p class="mt-1 text-sm text-text-muted">Submit a scrape order to get started</p>
			<a href="/orders" class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300">
				Go to orders
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</a>
		</div>
	{:else if activeTab === 'calendar'}
		<CalendarView records={data.records} {colors} {notes} onnotechange={handleNoteChange} />
	{:else if activeTab === 'list'}
		<ListView records={data.records} {colors} {notes} />
	{:else}
		<ChartView records={data.records} {colors} />
	{/if}
</div>
