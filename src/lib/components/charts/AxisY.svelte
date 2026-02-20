<!--
	SVG y-axis with gridlines. scaleLinear assumed.
-->
<script lang="ts">
	import { getContext } from 'svelte';

	let { ticks = 5 }: { ticks?: number } = $props();

	const { width, yScale, xRange } = getContext<any>('LayerCake');

	const tickValues = $derived($yScale.ticks(ticks));
</script>

<g class="axis y-axis">
	{#each tickValues as tick}
		{@const y = $yScale(tick)}
		<!-- gridline -->
		<line
			x1={0}
			x2={$width}
			y1={y}
			y2={y}
			class="stroke-border-subtle"
		/>
		<text
			x="-8"
			y={y}
			dy="3"
			text-anchor="end"
			class="fill-text-faint"
			style="font-size: 10px;"
		>
			{tick}
		</text>
	{/each}
</g>
