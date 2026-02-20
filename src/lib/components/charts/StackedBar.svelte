<!--
	SVG stacked column rects. Emits hover events for tooltip.
-->
<script lang="ts">
	import { getContext } from 'svelte';

	let { onhover, onleave }: {
		onhover?: (e: MouseEvent, seriesIndex: number, d: any) => void;
		onleave?: () => void;
	} = $props();

	const { data, xGet, yGet, zGet, xScale } = getContext<any>('LayerCake');
</script>

<g class="column-group">
	{#each $data as series, si}
		{#each series as d}
			{@const yVals = $yGet(d)}
			{@const colHeight = yVals[0] - yVals[1]}
			{#if colHeight > 0}
				<rect
					x={$xGet(d)}
					y={yVals[1]}
					width={$xScale.bandwidth()}
					height={colHeight}
					fill={$zGet(series)}
					rx="2"
					class="transition-opacity duration-150 hover:opacity-80"
					onmouseenter={(e) => onhover?.(e, si, d)}
					onmouseleave={() => onleave?.()}
				></rect>
			{/if}
		{/each}
	{/each}
</g>
