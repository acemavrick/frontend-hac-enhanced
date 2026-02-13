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

	const statusColors: Record<string, string> = {
		done: 'bg-green-100 text-green-700',
		error: 'bg-red-100 text-red-700',
		processing: 'bg-yellow-100 text-yellow-700',
		pending: 'bg-gray-100 text-gray-700'
	};

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
			<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[order.status] ?? statusColors.pending}">
				{order.status}
			</span>
			<span class="text-sm text-gray-500">{order.tasks.join(', ')}</span>
		</div>
		<span class="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
	</div>

	{#if order.status === 'processing'}
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
