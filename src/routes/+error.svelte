<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="text-center">
		<p class="text-6xl font-bold text-brand-600">{page.status}</p>
		<h1 class="mt-4 text-2xl font-bold text-gray-900">
			{#if page.status === 404}
				Page not found
			{:else if page.status === 500}
				Something went wrong
			{:else}
				Error
			{/if}
		</h1>
		<p class="mt-2 text-sm text-gray-500">{page.error?.message ?? 'An unexpected error occurred'}</p>
		<a
			href="/"
			class="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
		>
			Go home
		</a>
	</div>
</div>
