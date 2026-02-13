<script lang="ts">
	type Order = {
		id: string;
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
		if (SUCCESS.has(s)) return 'bg-green-100 text-green-700';
		if (FAILED.has(s)) return 'bg-red-100 text-red-700';
		return 'bg-yellow-100 text-yellow-700'; // any in-flight state
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
	class="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusStyle(order.status)}">
				{order.status.replace('_', ' ')}
			</span>
			<span class="text-sm text-gray-500">{order.tasks.join(', ')}</span>
		</div>
		<span class="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
	</div>

	{#if isInFlight(order.status)}
		<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
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
