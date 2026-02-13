<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">HAC Enhanced</h1>
			<p class="mt-2 text-sm text-gray-500">Sign in to your account</p>
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
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
			>
				{loading ? 'Signing in...' : 'Sign in'}
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-gray-500">
			Forgot your password? <a href="/reset" class="font-medium text-brand-600 hover:text-brand-500">Reset with master password</a>
		</p>
	</div>
</div>
