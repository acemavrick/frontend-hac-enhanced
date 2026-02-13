<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let hacLoading = $state(false);
	let pwLoading = $state(false);
</script>

<svelte:head><title>Settings - HAC Enhanced</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Settings</h1>
		<p class="mt-1 text-sm text-gray-500">Manage your HAC credentials and account settings</p>
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
		class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold text-gray-900">HAC Credentials</h2>
		<p class="mt-1 text-sm text-gray-500">Your HAC password is encrypted at rest</p>

		{#if form?.hacError}
			<div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.hacError}</div>
		{/if}
		{#if form?.hacSuccess}
			<div class="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">HAC credentials saved</div>
		{/if}

		<div class="mt-5 space-y-4">
			<div>
				<label for="hacUsername" class="block text-sm font-medium text-gray-700">HAC Student ID</label>
				<input
					id="hacUsername"
					name="hacUsername"
					type="text"
					value={data.hacUsername}
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="hacPassword" class="block text-sm font-medium text-gray-700">HAC Password</label>
				{#if data.hasHacPassword}
					<p class="mt-0.5 text-xs text-gray-400">Leave blank to keep existing password</p>
				{/if}
				<input
					id="hacPassword"
					name="hacPassword"
					type="password"
					placeholder={data.hasHacPassword ? '••••••••' : ''}
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
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
		class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold text-gray-900">Change Password</h2>

		{#if form?.pwError}
			<div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.pwError}</div>
		{/if}
		{#if form?.pwSuccess}
			<div class="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Password updated</div>
		{/if}

		<div class="mt-5 space-y-4">
			<div>
				<label for="currentPassword" class="block text-sm font-medium text-gray-700">Current password</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="newPassword" class="block text-sm font-medium text-gray-700">New password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm new password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
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
</div>
