<!--
	SVG x-axis for scaleBand. Renders tick labels below the chart area.
-->
<script lang="ts">
	import { getContext } from 'svelte';

	const { width, height, xScale, yRange } = getContext<any>('LayerCake');
</script>

<g class="axis x-axis">
	{#each $xScale.domain() as tick}
		{@const x = $xScale(tick) + $xScale.bandwidth() / 2}
		<g transform="translate({x}, {$yRange[0]})">
			<text
				y="14"
				text-anchor="middle"
				class="fill-text-muted"
				style="font-size: 10px;"
			>
				{tick}
			</text>
		</g>
	{/each}

	<!-- baseline -->
	<line
		x1="0"
		x2={$width}
		y1={$height}
		y2={$height}
		class="stroke-border"
	/>
</g>
