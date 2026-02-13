<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">Reset Password</h1>
			<p class="mt-2 text-sm text-gray-500">Use your master password to reset</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
		>
			{#if form?.error}
				<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="username" class="block text-sm font-medium text-gray-700">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					value={form?.username ?? ''}
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<div>
				<label for="masterPassword" class="block text-sm font-medium text-gray-700">Master password</label>
				<input
					id="masterPassword"
					name="masterPassword"
					type="password"
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<hr class="border-gray-200" />

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

			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
			>
				{loading ? 'Resetting...' : 'Reset password'}
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-gray-500">
			<a href="/login" class="font-medium text-brand-600 hover:text-brand-500">Back to sign in</a>
		</p>
	</div>
</div>
