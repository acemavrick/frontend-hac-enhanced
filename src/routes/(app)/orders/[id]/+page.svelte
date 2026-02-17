<script lang="ts">
	import type { PageData } from './$types';
	import OrderProgress from '$lib/components/orders/OrderProgress.svelte';

	let { data }: { data: PageData } = $props();
	const o = $derived(data.order);

	const FAILED = new Set(['failed', 'failed_auth', 'timed_out', 'canceled']);
	const SUCCESS = new Set(['complete', 'partial']);

	function isInFlight(s: string) {
		return !FAILED.has(s) && !SUCCESS.has(s);
	}

	function statusStyle(s: string): string {
		if (SUCCESS.has(s)) return 'bg-green-100 text-green-700';
		if (FAILED.has(s)) return 'bg-red-100 text-red-700';
		return 'bg-yellow-100 text-yellow-700';
	}

	function fmtDate(ts: number) {
		return new Date(ts).toLocaleString();
	}
</script>

<svelte:head><title>Order Detail - HAC Enhanced</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a href="/orders" class="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700">
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
		</svg>
		Back to orders
	</a>

	<div class="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-xl font-bold text-gray-900">Order Detail</h1>
				<p class="mt-1 font-mono text-xs text-gray-400">{o.id}</p>
			</div>
			<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusStyle(o.status)}">
				{o.status.replace('_', ' ')}
			</span>
		</div>

		{#if isInFlight(o.status)}
			<div class="mt-6">
				<OrderProgress orderId={o.id} initialProgress={o.progress} />
			</div>
		{/if}

		<dl class="mt-6 space-y-4 text-sm">
			<div class="flex justify-between">
				<dt class="text-gray-500">Tasks</dt>
				<dd class="font-medium text-gray-900">{o.tasks.join(', ')}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-gray-500">Submitted</dt>
				<dd class="font-medium text-gray-900">{fmtDate(o.createdAt)}</dd>
			</div>
			{#if o.completedAt}
				<div class="flex justify-between">
					<dt class="text-gray-500">Completed</dt>
					<dd class="font-medium text-gray-900">{fmtDate(o.completedAt)}</dd>
				</div>
			{/if}
			{#if SUCCESS.has(o.status)}
				<div class="flex justify-between">
					<dt class="text-gray-500">Attendance records</dt>
					<dd class="font-medium text-gray-900">{o.attendanceCount}</dd>
				</div>
			{/if}
			{#if o.error}
				<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
					{o.error}
				</div>
			{/if}
		</dl>

		{#if o.rawResponse}
			<details class="mt-6">
				<summary class="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
					Raw scraper response
				</summary>
				<pre class="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">{JSON.stringify(JSON.parse(o.rawResponse), null, 2)}</pre>
			</details>
		{/if}
	</div>
</div>
