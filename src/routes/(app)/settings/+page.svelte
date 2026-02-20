<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORY_IDS, CATEGORY_META, DEFAULT_CATEGORY_MAP, DEFAULT_COLORS } from '$lib/categories';
	import type { CategoryId } from '$lib/categories';
	import type { PageData, ActionData } from './$types';
	import ImportPanel from '$lib/components/settings/ImportPanel.svelte';

	let devToolsOpen = $state(false);

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let hacLoading = $state(false);
	let pwLoading = $state(false);
	let catLoading = $state(false);

	// local editable copies — re-sync when server data changes
	let map = $state<Record<string, string>>({});
	let colorMap = $state<Record<string, string>>({});
	$effect(() => { map = { ...data.categoryMap }; });
	$effect(() => { colorMap = { ...DEFAULT_COLORS, ...data.categoryColors }; });
	let newCode = $state('');

	// merge server-known codes with any user-added codes
	const codes = $derived([...new Set([...data.uniqueCodes, ...Object.keys(map)])].sort());

	function getCategory(code: string): string {
		return map[code] ?? DEFAULT_CATEGORY_MAP[code] ?? 'other';
	}

	// build the map to submit — include all codes
	function buildMapForSubmit(): Record<string, string> {
		const result: Record<string, string> = {};
		for (const code of codes) {
			result[code] = getCategory(code);
		}
		return result;
	}

	// group codes by their resolved category for the unified editor
	const codesByCategory = $derived.by(() => {
		const grouped: Record<CategoryId, string[]> = {
			present: [], absent: [], tardy: [], excused: [], other: []
		};
		for (const code of codes) {
			const cat = getCategory(code) as CategoryId;
			if (grouped[cat]) grouped[cat].push(code);
			else grouped.other.push(code);
		}
		return grouped;
	});

	function addCode() {
		const trimmed = newCode.trim().toLowerCase();
		if (trimmed && !codes.includes(trimmed)) {
			map[trimmed] = 'other';
		}
		newCode = '';
	}

	function moveCode(code: string, newCat: string) {
		map[code] = newCat;
	}
</script>

<svelte:head><title>Settings - HAC Enhanced</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-text-primary">Settings</h1>
		<p class="mt-1 text-sm text-text-muted">Manage your HAC credentials and account settings</p>
	</div>

	<!-- HAC Credentials -->
	<form
		method="POST"
		action="?/saveHac"
		use:enhance={() => {
			hacLoading = true;
			return async ({ update }) => {
				hacLoading = false;
				await update();
			};
		}}
		class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold text-text-primary">HAC Credentials</h2>
		<p class="mt-1 text-sm text-text-muted">Your HAC password is encrypted at rest</p>

		{#if form?.hacError}
			<div class="mt-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{form.hacError}</div>
		{/if}
		{#if form?.hacSuccess}
			<div class="mt-4 rounded-lg bg-green-900/30 px-4 py-3 text-sm text-green-400">HAC credentials saved</div>
		{/if}

		<div class="mt-5 space-y-4">
			<div>
				<label for="hacUsername" class="block text-sm font-medium text-text-secondary">HAC Student ID</label>
				<input
					id="hacUsername"
					name="hacUsername"
					type="text"
					value={data.hacUsername}
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="hacPassword" class="block text-sm font-medium text-text-secondary">HAC Password</label>
				{#if data.hasHacPassword}
					<p class="mt-0.5 text-xs text-text-faint">Leave blank to keep existing password</p>
				{/if}
				<input
					id="hacPassword"
					name="hacPassword"
					type="password"
					placeholder={data.hasHacPassword ? '••••••••' : ''}
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
		</div>

		<div class="mt-6 flex justify-end">
			<button
				type="submit"
				disabled={hacLoading}
				class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
			>
				{hacLoading ? 'Saving...' : 'Save credentials'}
			</button>
		</div>
	</form>

	<!-- Category Editor (mappings + colors) -->
	<form
		method="POST"
		action="?/saveCategories"
		use:enhance={() => {
			catLoading = true;
			return async ({ update }) => {
				catLoading = false;
				await update();
			};
		}}
		class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold text-text-primary">Attendance Categories</h2>
		<p class="mt-1 text-sm text-text-muted">Map HAC status codes to categories and customize colors</p>

		{#if form?.catError}
			<div class="mt-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{form.catError}</div>
		{/if}
		{#if form?.catSuccess}
			<div class="mt-4 rounded-lg bg-green-900/30 px-4 py-3 text-sm text-green-400">Categories saved</div>
		{/if}

		<!-- hidden inputs carry serialized data -->
		<input type="hidden" name="categoryMap" value={JSON.stringify(buildMapForSubmit())} />
		<input type="hidden" name="categoryColors" value={JSON.stringify(colorMap)} />

		<div class="mt-5 space-y-4">
			{#each CATEGORY_IDS as catId (catId)}
				{@const catCodes = codesByCategory[catId]}
				<div class="rounded-lg border border-border-subtle p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<input
								type="color"
								value={colorMap[catId] ?? DEFAULT_COLORS[catId]}
								oninput={(e) => { colorMap[catId] = (e.target as HTMLInputElement).value; }}
								class="h-7 w-7 cursor-pointer rounded border border-border"
								title="Pick color for {CATEGORY_META[catId].label}"
							/>
							<span class="text-sm font-semibold text-text-primary">{CATEGORY_META[catId].label}</span>
						</div>
					</div>

					<!-- code chips -->
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#if catCodes.length === 0}
							<span class="text-xs text-text-faint italic">No codes mapped</span>
						{:else}
							{#each catCodes as code (code)}
								<span class="group inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2.5 py-1 text-xs text-text-secondary">
									<span class="capitalize">{code}</span>
									<!-- reassign dropdown -->
									<select
										class="ml-1 cursor-pointer border-none bg-transparent p-0 text-xs text-text-faint focus:ring-0"
										value={catId}
										onchange={(e) => moveCode(code, (e.target as HTMLSelectElement).value)}
										title="Move '{code}' to another category"
									>
										{#each CATEGORY_IDS as targetCat}
											<option value={targetCat}>{CATEGORY_META[targetCat].label}</option>
										{/each}
									</select>
								</span>
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- add new code -->
		<div class="mt-4 flex gap-2">
			<input
				type="text"
				bind:value={newCode}
				placeholder="Add a new HAC code..."
				class="flex-1 rounded-lg border-border text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
				onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCode(); } }}
			/>
			<button
				type="button"
				onclick={addCode}
				class="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition hover:bg-surface-overlay"
			>
				Add
			</button>
		</div>

		<div class="mt-6 flex justify-end">
			<button
				type="submit"
				disabled={catLoading}
				class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
			>
				{catLoading ? 'Saving...' : 'Save categories'}
			</button>
		</div>
	</form>

	<!-- Change Password -->
	<form
		method="POST"
		action="?/changePassword"
		use:enhance={() => {
			pwLoading = true;
			return async ({ update }) => {
				pwLoading = false;
				await update();
			};
		}}
		class="rounded-xl border border-border bg-surface-raised p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold text-text-primary">Change Password</h2>

		{#if form?.pwError}
			<div class="mt-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{form.pwError}</div>
		{/if}
		{#if form?.pwSuccess}
			<div class="mt-4 rounded-lg bg-green-900/30 px-4 py-3 text-sm text-green-400">Password updated</div>
		{/if}

		<div class="mt-5 space-y-4">
			<div>
				<label for="currentPassword" class="block text-sm font-medium text-text-secondary">Current password</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="newPassword" class="block text-sm font-medium text-text-secondary">New password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-text-secondary">Confirm new password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
		</div>

		<div class="mt-6 flex justify-end">
			<button
				type="submit"
				disabled={pwLoading}
				class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
			>
				{pwLoading ? 'Updating...' : 'Change password'}
			</button>
		</div>
	</form>

	<!-- Developer Tools -->
	<div class="rounded-xl border border-amber-800/50 bg-surface-raised p-6 shadow-sm">
		<button
			type="button"
			onclick={() => (devToolsOpen = !devToolsOpen)}
			class="flex w-full items-center justify-between"
		>
			<div>
				<h2 class="text-lg font-semibold text-amber-400">Developer Tools</h2>
				<p class="mt-0.5 text-xs text-text-faint">Advanced features — may affect your data</p>
			</div>
			<svg
				class="h-5 w-5 text-text-faint transition-transform {devToolsOpen ? 'rotate-180' : ''}"
				fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</button>

		{#if devToolsOpen}
			<div class="mt-5 space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-text-primary">Import Attendance Data</h3>
					<p class="mt-1 text-xs text-text-muted">
						Paste scraper-format JSON to import attendance records. Creates a new order visible in your orders list.
					</p>
				</div>
				<ImportPanel />
			</div>
		{/if}
	</div>
</div>
