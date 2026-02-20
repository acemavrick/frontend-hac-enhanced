<script lang="ts">
	import { fly } from 'svelte/transition';
	import { CATEGORY_META, categoryStyles, type CategoryId } from '$lib/categories';
	import type { NormalizedRecord } from '$lib/types';

	let { date, records, colors, note = '', mode = 'hover', onclose, onnotechange }: {
		date: string;
		records: NormalizedRecord[];
		colors: Record<CategoryId, string>;
		note?: string;
		mode?: 'hover' | 'click';
		onclose: () => void;
		onnotechange?: (date: string, content: string) => void;
	} = $props();

	let noteText = $state(note);
	let saving = $state(false);

	// sync external note changes
	$effect(() => { noteText = note; });

	const formatted = $derived.by(() => {
		const d = new Date(date + 'T00:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
	});

	function badgeStyle(cat: CategoryId): string {
		const s = categoryStyles(colors[cat] ?? colors.other);
		return `background-color: ${s.bg}; color: ${s.text};`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	async function saveNote() {
		const trimmed = noteText.trim();
		if (trimmed === (note ?? '').trim()) return;
		saving = true;
		try {
			await fetch('/api/attendance/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date, content: trimmed })
			});
			onnotechange?.(date, trimmed);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:window onkeydown={mode === 'click' ? handleKeydown : undefined} />

{#if mode === 'click'}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={onclose}></div>
{/if}

<!-- tooltip / popover -->
<div
	class="absolute z-50 w-72 rounded-xl border border-border bg-surface-raised p-4 shadow-lg"
	class:pointer-events-auto={mode === 'hover'}
	style={mode === 'hover' ? 'left: 50%; transform: translateX(-50%); top: calc(100% + 4px);' : ''}
	transition:fly={{ y: 6, duration: 100 }}
>
	<div class="mb-3 flex items-center justify-between">
		<h4 class="text-sm font-semibold text-text-primary">{formatted}</h4>
		{#if mode === 'click'}
			<button
				onclick={onclose}
				class="rounded p-0.5 text-text-faint hover:bg-surface-overlay hover:text-text-secondary"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if records.length === 0}
		<p class="text-xs text-text-faint">No attendance records for this day</p>
	{:else}
		<div class="space-y-1.5">
			{#each records as record (record.id)}
				<div class="flex items-center gap-3 text-xs text-text-muted">
					{#if record.period}
						<span class="w-6 font-medium text-text-secondary">P{record.period}</span>
					{/if}
					<span
						class="rounded px-1.5 py-0.5 text-xs font-medium"
						style={badgeStyle(record.category)}
					>
						{CATEGORY_META[record.category]?.label ?? record.category}
					</span>
					{#if record.time}
						<span class="ml-auto text-text-faint">{record.time}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- note — read-only in hover, editable in click -->
	{#if mode === 'hover' && note}
		<p class="mt-2 border-t border-border-subtle pt-2 text-xs italic text-text-muted">{note}</p>
	{:else if mode === 'click'}
		<div class="mt-3 border-t border-border-subtle pt-3">
			<label class="mb-1 block text-[10px] font-medium uppercase tracking-wider text-text-faint">Note</label>
			<textarea
				bind:value={noteText}
				onblur={saveNote}
				rows="2"
				placeholder="Add a note for this day..."
				class="w-full resize-none rounded-lg border border-border bg-surface-overlay px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
			></textarea>
			{#if saving}
				<span class="text-[10px] text-text-faint">Saving...</span>
			{/if}
		</div>
	{/if}
</div>
