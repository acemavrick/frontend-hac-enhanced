<script lang="ts">
	type Order = {
		id: string;
		source: string;
		tasks: string[];
		status: string;
		progress: number;
		error: string | null;
		createdAt: number;
		completedAt: number | null;
	};

	let { order }: { order: Order } = $props();

	const FAILED = new Set(['failed', 'failed_auth', 'timed_out', 'canceled']);
	const SUCCESS = new Set(['complete', 'partial']);

	function statusStyle(s: string): string {
		if (SUCCESS.has(s)) return 'bg-green-900/30 text-green-400';
		if (FAILED.has(s)) return 'bg-red-900/30 text-red-400';
		return 'bg-yellow-900/30 text-yellow-400'; // any in-flight state
	}

	function isInFlight(s: string): boolean {
		return !SUCCESS.has(s) && !FAILED.has(s);
	}

	function timeAgo(ts: number): string {
		const diff = Date.now() - ts;
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<a
	href="/orders/{order.id}"
	class="block rounded-xl border border-border bg-surface-raised p-5 shadow-sm transition hover:border-border hover:shadow"
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusStyle(order.status)}">
				{order.status.replace('_', ' ')}
			</span>
			{#if order.source === 'import'}
				<span class="inline-flex items-center rounded-full bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-400">Import</span>
			{/if}
			<span class="text-sm text-text-muted">{order.tasks.join(', ')}</span>
		</div>
		<span class="text-xs text-text-faint">{timeAgo(order.createdAt)}</span>
	</div>

	{#if isInFlight(order.status)}
		<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
			<div
				class="h-full rounded-full bg-brand-500 transition-all duration-500"
				style="width: {Math.round(order.progress * 100)}%"
			></div>
		</div>
	{/if}

	{#if order.error}
		<p class="mt-2 text-xs text-red-500 truncate">{order.error}</p>
	{/if}
</a>
