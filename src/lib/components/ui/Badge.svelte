<script lang="ts">
	type Variant = 'green' | 'red' | 'yellow' | 'gray' | 'blue';
	let { variant = 'gray', children }: { variant?: Variant; children: import('svelte').Snippet } = $props();

	const colors: { [key in Variant]: string } = {
		green: 'bg-green-900/30 text-green-400',
		red: 'bg-red-900/30 text-red-400',
		yellow: 'bg-yellow-900/30 text-yellow-400',
		gray: 'bg-surface-overlay text-text-secondary',
		blue: 'bg-blue-900/30 text-blue-400'
	};
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {colors[variant]}">
	{@render children()}
</span>
