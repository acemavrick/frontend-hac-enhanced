<!--
	Floating tooltip positioned by mouse coordinates.
	Rendered in an Html layer on top of the SVG chart.
-->
<script lang="ts">
	let { x, y, visible, lines }: {
		x: number;
		y: number;
		visible: boolean;
		lines: { label: string; value: string; color: string }[];
	} = $props();
</script>

{#if visible}
	<div
		class="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-raised px-3 py-2 shadow-md"
		style="left: {x + 12}px; top: {y - 10}px;"
	>
		{#each lines as line}
			<div class="flex items-center gap-2 text-xs">
				<span class="inline-block h-2 w-2 rounded-full" style="background-color: {line.color}"></span>
				<span class="text-text-muted">{line.label}</span>
				<span class="ml-auto font-medium text-text-secondary">{line.value}</span>
			</div>
		{/each}
	</div>
{/if}
