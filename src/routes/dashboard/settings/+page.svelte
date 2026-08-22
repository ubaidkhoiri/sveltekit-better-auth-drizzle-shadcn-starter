<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { form: formData, errors, enhance, submitting, message } = superForm(data.form);
</script>

<svelte:head>
	<title>Pengaturan Auth</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Pengaturan Login</h1>
		<p class="text-sm text-muted-foreground">Berlaku langsung setelah disimpan.</p>
	</header>

	{#if $message}
		<p class="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
			{$message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<Card.Root>
			<Card.Content class="space-y-4 pt-6">
				<div class="space-y-1.5">
					<Label for="loginMethod">Metode login</Label>
					<select
						id="loginMethod"
						name="loginMethod"
						class="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
						bind:value={$formData.loginMethod}
					>
						<option value="both">Password &amp; Google</option>
						<option value="password">Password saja</option>
						<option value="google">Google saja</option>
					</select>
				</div>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="signupEnabled" class="h-4 w-4" checked={$formData.signupEnabled === 'on'} />
					Izinkan pendaftaran mandiri (sign-up)
				</label>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="usernameLogin" class="h-4 w-4" checked={$formData.usernameLogin === 'on'} />
					Login dengan username
				</label>

				<div class="space-y-1.5">
					<Label for="verificationMode">Verifikasi email</Label>
					<select
						id="verificationMode"
						name="verificationMode"
						class="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
						bind:value={$formData.verificationMode}
					>
						<option value="optional">Tidak diwajibkan</option>
						<option value="required">Wajib (klik tautan email)</option>
						<option value="auto_domain">Otomatis untuk domain tertentu</option>
					</select>
				</div>

				{#if $formData.verificationMode === 'auto_domain'}
					<div class="space-y-1.5">
						<Label for="autoVerifyDomains">Domain terpercaya (pisahkan koma)</Label>
						<Input id="autoVerifyDomains" name="autoVerifyDomains" bind:value={$formData.autoVerifyDomains} />
						{#if $errors.autoVerifyDomains}<p class="text-xs text-destructive">{$errors.autoVerifyDomains}</p>{/if}
					</div>
				{/if}

				<div class="space-y-1.5">
					<Label for="resetMode">Reset password</Label>
					<select
						id="resetMode"
						name="resetMode"
						class="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
						bind:value={$formData.resetMode}
					>
						<option value="email">Self-service via email</option>
						<option value="admin">Manual oleh admin</option>
					</select>
				</div>

				<Button type="submit" class="w-full" disabled={$submitting}>
					{$submitting ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</Card.Content>
		</Card.Root>
	</form>
</main>
