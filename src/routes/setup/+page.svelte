<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">HAC Enhanced</h1>
			<p class="mt-2 text-sm text-text-muted">First-time setup — create your account</p>
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
			class="space-y-5 rounded-xl border border-border bg-surface-raised p-8 shadow-sm"
		>
			{#if form?.error}
				<div class="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="username" class="block text-sm font-medium text-text-secondary">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					value={form?.username ?? ''}
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-text-secondary">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-text-secondary">Confirm password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<hr class="border-border" />

			<div>
				<label for="masterPassword" class="block text-sm font-medium text-text-secondary">Master password</label>
				<p class="mt-0.5 text-xs text-text-faint">For account recovery — store this somewhere safe</p>
				<input
					id="masterPassword"
					name="masterPassword"
					type="password"
					required
					class="mt-1 block w-full rounded-lg border-border shadow-sm transition focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
			>
				{loading ? 'Setting up...' : 'Create account'}
			</button>
		</form>
	</div>
</div>
