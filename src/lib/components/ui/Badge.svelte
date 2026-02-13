<script lang="ts">
	type Variant = 'green' | 'red' | 'yellow' | 'gray' | 'blue';
	let { variant = 'gray', children }: { variant?: Variant; children: import('svelte').Snippet } = $props();

	const colors: { [key in Variant]: string } = {
		green: 'bg-green-100 text-green-700',
		red: 'bg-red-100 text-red-700',
		yellow: 'bg-yellow-100 text-yellow-700',
		gray: 'bg-gray-100 text-gray-700',
		blue: 'bg-blue-100 text-blue-700'
	};
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {colors[variant]}">
	{@render children()}
</span>
