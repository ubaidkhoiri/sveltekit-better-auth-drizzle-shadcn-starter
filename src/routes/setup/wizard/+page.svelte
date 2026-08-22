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
	<title>Setup Awal App</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Setup Awal</h1>
		<p class="text-sm text-muted-foreground">
			Buat akun owner dan tentukan aturan login app. Halaman ini hanya muncul sekali.
		</p>
	</header>

	{#if $message}
		<p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{$message}</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<Card.Root>
			<Card.Header>
				<Card.Title>Akun Owner</Card.Title>
				<Card.Description>Owner dapat mengubah pengaturan kapan saja.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1.5">
					<Label for="name">Nama</Label>
					<Input id="name" name="name" required bind:value={$formData.name} />
					{#if $errors.name}<p class="text-xs text-destructive">{$errors.name}</p>{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required bind:value={$formData.email} />
					{#if $errors.email}<p class="text-xs text-destructive">{$errors.email}</p>{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="username">Username <span class="text-xs text-muted-foreground">(opsional)</span></Label>
					<Input id="username" name="username" type="text" bind:value={$formData.username} />
					{#if $errors.username}<p class="text-xs text-destructive">{$errors.username}</p>{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" minlength={8} required bind:value={$formData.password} />
					{#if $errors.password}<p class="text-xs text-destructive">{$errors.password}</p>{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Kebijakan Login</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
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
						<Input id="autoVerifyDomains" name="autoVerifyDomains" placeholder="perusahaan.com, cabang.co.id" bind:value={$formData.autoVerifyDomains} />
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
			</Card.Content>
		</Card.Root>

		<Button type="submit" class="w-full" disabled={$submitting}>
			{$submitting ? 'Menyiapkan...' : 'Selesaikan Setup'}
		</Button>
	</form>
</main>
