<script lang="ts">
	import type { PageData } from './$types';
	import OrderCard from '$lib/components/orders/OrderCard.svelte';
	import NewScrapeButton from '$lib/components/orders/NewScrapeButton.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Orders - HAC Enhanced</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Scrape Orders</h1>
			<p class="mt-1 text-sm text-gray-500">View history and start new scrapes</p>
		</div>
		<NewScrapeButton />
	</div>

	<div class="mt-6 space-y-4">
		{#if data.orders.length === 0}
			<div class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
				<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
				</svg>
				<h3 class="mt-3 text-sm font-medium text-gray-900">No orders yet</h3>
				<p class="mt-1 text-sm text-gray-500">Submit your first scrape to get started</p>
			</div>
		{:else}
			{#each data.orders as order (order.id)}
				<OrderCard {order} />
			{/each}
		{/if}
	</div>
</div>
