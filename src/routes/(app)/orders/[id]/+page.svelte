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
		if (SUCCESS.has(s)) return 'bg-green-900/30 text-green-400';
		if (FAILED.has(s)) return 'bg-red-900/30 text-red-400';
		return 'bg-yellow-900/30 text-yellow-400';
	}

	function fmtDate(ts: number) {
		return new Date(ts).toLocaleString();
	}
</script>

<svelte:head><title>Order Detail - HAC Enhanced</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a href="/orders" class="inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-text-primary">
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
		</svg>
		Back to orders
	</a>

	<div class="mt-4 rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-xl font-bold text-text-primary">Order Detail</h1>
				<p class="mt-1 font-mono text-xs text-text-faint">{o.id}</p>
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
				<dt class="text-text-muted">Tasks</dt>
				<dd class="font-medium text-text-primary">{o.tasks.join(', ')}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-text-muted">Submitted</dt>
				<dd class="font-medium text-text-primary">{fmtDate(o.createdAt)}</dd>
			</div>
			{#if o.completedAt}
				<div class="flex justify-between">
					<dt class="text-text-muted">Completed</dt>
					<dd class="font-medium text-text-primary">{fmtDate(o.completedAt)}</dd>
				</div>
			{/if}
			{#if SUCCESS.has(o.status)}
				<div class="flex justify-between">
					<dt class="text-text-muted">Attendance records</dt>
					<dd class="font-medium text-text-primary">{o.attendanceCount}</dd>
				</div>
			{/if}
			{#if o.error}
				<div class="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
					{o.error}
				</div>
			{/if}
		</dl>

		{#if o.rawResponse}
			<details class="mt-6">
				<summary class="cursor-pointer text-sm font-medium text-text-muted hover:text-text-primary">
					Raw scraper response
				</summary>
				<pre class="mt-2 max-h-96 overflow-auto rounded-lg bg-surface p-4 text-xs text-text-secondary">{JSON.stringify(JSON.parse(o.rawResponse), null, 2)}</pre>
			</details>
		{/if}
	</div>
</div>
