<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let jsonInput = $state('');
	let step = $state<'input' | 'preview' | 'done'>('input');
	let loading = $state(false);
	let errorMsg = $state('');

	// preview data
	let preview = $state<{
		totalRecords: number;
		duplicates: number;
		dropped: { location: string; raw: string; reason: string }[];
		warnings: string[];
		sample: { date: string; category: string; period: string | null; time: string | null }[];
	} | null>(null);

	let importResult = $state<{ imported: number; warnings: string[] } | null>(null);

	async function handlePreview() {
		errorMsg = '';
		loading = true;
		try {
			let parsed: unknown;
			try {
				parsed = JSON.parse(jsonInput);
			} catch {
				errorMsg = 'Invalid JSON — check your syntax';
				return;
			}

			const res = await fetch('/api/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Import failed' }));
				errorMsg = err.message ?? 'Import failed';
				return;
			}

			preview = await res.json();
			step = 'preview';
		} finally {
			loading = false;
		}
	}

	async function handleConfirm() {
		errorMsg = '';
		loading = true;
		try {
			let parsed: unknown;
			try { parsed = JSON.parse(jsonInput); } catch { return; }

			const res = await fetch('/api/import?confirm=true', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Import failed' }));
				errorMsg = err.message ?? 'Import failed';
				return;
			}

			importResult = await res.json();
			step = 'done';
			await invalidateAll();
		} finally {
			loading = false;
		}
	}

	function reset() {
		jsonInput = '';
		step = 'input';
		preview = null;
		importResult = null;
		errorMsg = '';
	}
</script>

<div class="space-y-4">
	{#if step === 'input'}
		<textarea
			bind:value={jsonInput}
			rows="8"
			placeholder='Paste scraper JSON here...&#10;&#10;Example: &#123; "January": &#123; "month": "January", "year": "2026", "dates": &#123; "15": "1,Present|2,Present" &#125; &#125; &#125;'
			class="w-full rounded-lg border border-border bg-surface-overlay px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
		></textarea>

		{#if errorMsg}
			<div class="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{errorMsg}</div>
		{/if}

		<button
			type="button"
			onclick={handlePreview}
			disabled={loading || !jsonInput.trim()}
			class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
		>
			{loading ? 'Parsing...' : 'Preview Import'}
		</button>

	{:else if step === 'preview' && preview}
		<div class="space-y-3">
			<!-- summary stats -->
			<div class="flex flex-wrap gap-3">
				<div class="rounded-lg border border-border bg-surface-overlay px-3 py-2">
					<div class="text-lg font-bold text-text-primary">{preview.totalRecords}</div>
					<div class="text-[10px] uppercase text-text-muted">Records</div>
				</div>
				{#if preview.duplicates > 0}
					<div class="rounded-lg border border-yellow-800 bg-yellow-900/30 px-3 py-2">
						<div class="text-lg font-bold text-yellow-400">{preview.duplicates}</div>
						<div class="text-[10px] uppercase text-yellow-400/70">Overlapping</div>
					</div>
				{/if}
				{#if preview.dropped.length > 0}
					<div class="rounded-lg border border-red-800 bg-red-900/30 px-3 py-2">
						<div class="text-lg font-bold text-red-400">{preview.dropped.length}</div>
						<div class="text-[10px] uppercase text-red-400/70">Dropped</div>
					</div>
				{/if}
			</div>

			<!-- warnings -->
			{#if preview.warnings.length > 0}
				<div class="rounded-lg border border-yellow-800 bg-yellow-900/20 px-3 py-2">
					{#each preview.warnings as warning}
						<p class="text-xs text-yellow-400">{warning}</p>
					{/each}
				</div>
			{/if}

			<!-- sample table -->
			{#if preview.sample.length > 0}
				<div class="overflow-x-auto rounded-lg border border-border">
					<table class="w-full text-xs">
						<thead class="bg-surface-overlay">
							<tr>
								<th class="px-3 py-1.5 text-left font-medium text-text-muted">Date</th>
								<th class="px-3 py-1.5 text-left font-medium text-text-muted">Period</th>
								<th class="px-3 py-1.5 text-left font-medium text-text-muted">Category</th>
								<th class="px-3 py-1.5 text-left font-medium text-text-muted">Time</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border-subtle">
							{#each preview.sample as row}
								<tr>
									<td class="px-3 py-1.5 text-text-primary">{row.date}</td>
									<td class="px-3 py-1.5 text-text-secondary">{row.period ?? '—'}</td>
									<td class="px-3 py-1.5 text-text-secondary">{row.category}</td>
									<td class="px-3 py-1.5 text-text-faint">{row.time ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if preview.totalRecords > 20}
						<div class="border-t border-border-subtle bg-surface-overlay px-3 py-1.5 text-[10px] text-text-faint">
							Showing 20 of {preview.totalRecords} records
						</div>
					{/if}
				</div>
			{/if}

			<!-- dropped items -->
			{#if preview.dropped.length > 0}
				<details class="rounded-lg border border-border">
					<summary class="cursor-pointer px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-overlay">
						{preview.dropped.length} dropped entries
					</summary>
					<div class="max-h-40 overflow-y-auto border-t border-border-subtle">
						{#each preview.dropped as item}
							<div class="px-3 py-1.5 text-xs">
								<span class="text-text-muted">{item.location}:</span>
								<span class="text-red-400">{item.reason}</span>
								<span class="ml-1 text-text-faint">({item.raw})</span>
							</div>
						{/each}
					</div>
				</details>
			{/if}

			{#if errorMsg}
				<div class="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{errorMsg}</div>
			{/if}

			<div class="flex gap-2">
				<button
					type="button"
					onclick={handleConfirm}
					disabled={loading || preview.totalRecords === 0}
					class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
				>
					{loading ? 'Importing...' : `Import ${preview.totalRecords} Records`}
				</button>
				<button
					type="button"
					onclick={reset}
					class="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary transition hover:bg-surface-overlay"
				>
					Back
				</button>
			</div>
		</div>

	{:else if step === 'done' && importResult}
		<div class="rounded-lg bg-green-900/30 px-4 py-3">
			<p class="text-sm font-medium text-green-400">
				Successfully imported {importResult.imported} records
			</p>
			{#if importResult.warnings.length > 0}
				{#each importResult.warnings as warning}
					<p class="mt-1 text-xs text-yellow-400">{warning}</p>
				{/each}
			{/if}
		</div>
		<button
			type="button"
			onclick={reset}
			class="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary transition hover:bg-surface-overlay"
		>
			Import More
		</button>
	{/if}
</div>
