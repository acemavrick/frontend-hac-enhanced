<script lang="ts">
	type Order = { id: string; tasks: string[]; status: string; createdAt: number };
	type DiffResult = {
		added: Array<{ date: string; category: string; period: string | null }>;
		removed: Array<{ date: string; category: string; period: string | null }>;
		changed: Array<{ date: string; period: string | null; before: string; after: string }>;
	};

	let { orders }: { orders: Order[] } = $props();

	// only completed orders can be compared
	const completedOrders = $derived(orders.filter((o) => o.status === 'complete' || o.status === 'partial'));

	let orderA = $state('');
	let orderB = $state('');
	let loading = $state(false);
	let diff = $state<DiffResult | null>(null);
	let error = $state('');

	async function compare() {
		if (!orderA || !orderB || orderA === orderB) return;
		loading = true;
		error = '';
		diff = null;

		try {
			const res = await fetch(`/api/attendance/compare?a=${orderA}&b=${orderB}`);
			if (!res.ok) throw new Error('Comparison failed');
			diff = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to compare';
		} finally {
			loading = false;
		}
	}

	function fmtDate(ts: number) {
		return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

{#if completedOrders.length >= 2}
	<div class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-text-primary">Compare Runs</h2>
		<p class="mt-1 text-sm text-text-muted">See what changed between two scrape runs</p>

		<div class="mt-4 flex flex-wrap items-end gap-3">
			<div>
				<label for="orderA" class="block text-xs font-medium text-text-muted">Older run</label>
				<select id="orderA" bind:value={orderA} class="mt-1 rounded-lg border-border bg-surface-raised text-sm text-text-primary shadow-sm focus:border-brand-500 focus:ring-brand-500">
					<option value="">Select...</option>
					{#each completedOrders as o (o.id)}
						<option value={o.id}>{fmtDate(o.createdAt)} — {o.id.slice(0, 8)}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="orderB" class="block text-xs font-medium text-text-muted">Newer run</label>
				<select id="orderB" bind:value={orderB} class="mt-1 rounded-lg border-border bg-surface-raised text-sm text-text-primary shadow-sm focus:border-brand-500 focus:ring-brand-500">
					<option value="">Select...</option>
					{#each completedOrders as o (o.id)}
						<option value={o.id}>{fmtDate(o.createdAt)} — {o.id.slice(0, 8)}</option>
					{/each}
				</select>
			</div>
			<button
				onclick={compare}
				disabled={loading || !orderA || !orderB || orderA === orderB}
				class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
			>
				{loading ? 'Comparing...' : 'Compare'}
			</button>
		</div>

		{#if error}
			<div class="mt-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{error}</div>
		{/if}

		{#if diff}
			<div class="mt-6 space-y-4">
				{#if diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0}
					<p class="text-sm text-text-muted">No differences found between these runs</p>
				{/if}

				{#if diff.added.length > 0}
					<div>
						<h3 class="text-sm font-medium text-green-400">Added ({diff.added.length})</h3>
						<div class="mt-2 space-y-1">
							{#each diff.added as item}
								<div class="flex items-center gap-2 text-sm">
									<span class="h-2 w-2 rounded-full bg-green-400"></span>
									<span class="text-text-secondary">{item.date}</span>
									{#if item.period}<span class="text-xs text-text-faint">P{item.period}</span>{/if}
									<span class="rounded bg-green-900/30 px-1.5 py-0.5 text-xs text-green-400">{item.category}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if diff.removed.length > 0}
					<div>
						<h3 class="text-sm font-medium text-red-400">Removed ({diff.removed.length})</h3>
						<div class="mt-2 space-y-1">
							{#each diff.removed as item}
								<div class="flex items-center gap-2 text-sm">
									<span class="h-2 w-2 rounded-full bg-red-400"></span>
									<span class="text-text-secondary">{item.date}</span>
									{#if item.period}<span class="text-xs text-text-faint">P{item.period}</span>{/if}
									<span class="rounded bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">{item.category}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if diff.changed.length > 0}
					<div>
						<h3 class="text-sm font-medium text-yellow-400">Changed ({diff.changed.length})</h3>
						<div class="mt-2 space-y-1">
							{#each diff.changed as item}
								<div class="flex items-center gap-2 text-sm">
									<span class="h-2 w-2 rounded-full bg-yellow-400"></span>
									<span class="text-text-secondary">{item.date}</span>
									{#if item.period}<span class="text-xs text-text-faint">P{item.period}</span>{/if}
									<span class="text-text-faint">{item.before}</span>
									<svg class="h-3 w-3 text-text-faint" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
									</svg>
									<span class="text-text-secondary">{item.after}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
