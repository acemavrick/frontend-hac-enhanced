<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type CompletedOrder = {
		id: string;
		source: string;
		tasks: string;
		createdAt: number | null;
		completedAt: number | null;
	};

	let { orders, selectedIds }: { orders: CompletedOrder[]; selectedIds: string[] } = $props();

	let open = $state(false);
	let selected = $state<Set<string>>(new Set(selectedIds));
	let dropdownEl: HTMLDivElement | undefined = $state();

	// sync if page data reloads
	$effect(() => { selected = new Set(selectedIds); });

	const isDefault = $derived(selected.size === 0);
	const activeCount = $derived(selected.size);

	function toggle(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
		applySelection(next);
	}

	function selectAll() {
		selected = new Set(orders.map((o) => o.id));
		applySelection(selected);
	}

	function clearSelection() {
		selected = new Set();
		applySelection(selected);
	}

	function applySelection(ids: Set<string>) {
		const params = new URLSearchParams(page.url.searchParams);
		if (ids.size > 0) params.set('orders', [...ids].join(','));
		else params.delete('orders');
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function formatDate(epoch: number | null): string {
		if (!epoch) return '—';
		return new Date(epoch).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// close on outside click
	function handleClickOutside(e: MouseEvent) {
		if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="relative" bind:this={dropdownEl}>
	<!-- trigger button -->
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition
		{isDefault
			? 'bg-surface-overlay text-text-secondary hover:bg-surface-overlay/80'
			: 'bg-brand-900/40 text-brand-300'}"
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
		</svg>
		{#if isDefault}
			Latest Order
		{:else}
			{activeCount} Order{activeCount !== 1 ? 's' : ''}
		{/if}
		<svg class="h-3 w-3 transition {open ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	<!-- dropdown -->
	{#if open}
		<div class="absolute left-0 z-50 mt-1.5 w-80 rounded-xl border border-border bg-surface-raised shadow-lg">
			<div class="flex items-center justify-between border-b border-border px-3 py-2">
				<span class="text-xs font-medium text-text-muted">Select Orders</span>
				<div class="flex gap-2">
					<button onclick={selectAll} class="text-[10px] text-brand-400 hover:text-brand-300">All</button>
					<button onclick={clearSelection} class="text-[10px] text-text-faint hover:text-text-muted">Clear</button>
				</div>
			</div>

			<div class="max-h-64 overflow-y-auto p-1.5">
				{#each orders as order, i}
					{@const checked = selected.has(order.id)}
					{@const isLatest = i === 0}
					<button
						onclick={() => toggle(order.id)}
						class="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition
						{checked ? 'bg-brand-900/20' : 'hover:bg-surface-overlay'}"
					>
						<!-- checkbox -->
						<div class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition
							{checked ? 'border-brand-500 bg-brand-500' : 'border-border bg-surface-base'}">
							{#if checked}
								<svg class="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
								</svg>
							{/if}
						</div>

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<!-- source badge -->
								<span class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium
									{order.source === 'import'
										? 'bg-amber-900/30 text-amber-400'
										: 'bg-sky-900/30 text-sky-400'}">
									{order.source === 'import' ? 'Import' : 'Scrape'}
								</span>
								{#if isLatest}
									<span class="text-[10px] text-text-faint">(latest)</span>
								{/if}
							</div>
							<p class="mt-0.5 text-xs text-text-secondary">{formatDate(order.completedAt)}</p>
						</div>
					</button>
				{/each}

				{#if orders.length === 0}
					<p class="px-3 py-4 text-center text-xs text-text-faint">No completed orders</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
