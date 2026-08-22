<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const flags = data.flags;
	const showPassword = flags.loginMethod !== 'google';
	const showGoogle = flags.loginMethod !== 'password';

	const { form: formData, errors, enhance, submitting, message } = superForm(data.form);

	function signUpWithGoogle() {
		void authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
	}
</script>

<svelte:head>
	<title>Daftar</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
	<div class="w-full max-w-sm space-y-6">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-2xl">Buat akun</Card.Title>
				<Card.Description>Daftar untuk mulai menggunakan aplikasi</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if $message}
					<p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{$message}</p>
				{/if}

				{#if showGoogle}
					<Button type="button" variant="outline" class="w-full" onclick={signUpWithGoogle}>
						Lanjut dengan Google
					</Button>
				{/if}

				{#if showPassword && showGoogle}
					<div class="flex items-center gap-3">
						<Separator class="flex-1" />
						<span class="text-xs text-muted-foreground">atau daftar dengan email</span>
						<Separator class="flex-1" />
					</div>
				{/if}

				{#if showPassword}
					<form method="POST" use:enhance class="space-y-4">
						<div class="space-y-1.5">
							<Label for="name">Nama</Label>
							<Input id="name" name="name" type="text" autocomplete="name" required bind:value={$formData.name} />
							{#if $errors.name}<p class="text-xs text-destructive">{$errors.name}</p>{/if}
						</div>

						<div class="space-y-1.5">
							<Label for="email">Email</Label>
							<Input id="email" name="email" type="email" autocomplete="email" required bind:value={$formData.email} />
							{#if $errors.email}<p class="text-xs text-destructive">{$errors.email}</p>{/if}
						</div>

						<div class="space-y-1.5">
							<Label for="username">Username <span class="text-xs text-muted-foreground">(opsional)</span></Label>
							<Input id="username" name="username" type="text" autocomplete="username" bind:value={$formData.username} />
							{#if $errors.username}<p class="text-xs text-destructive">{$errors.username}</p>{/if}
						</div>

						<div class="space-y-1.5">
							<Label for="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autocomplete="new-password"
								minlength={8}
								required
								bind:value={$formData.password}
							/>
							{#if $errors.password}<p class="text-xs text-destructive">{$errors.password}</p>{/if}
						</div>

						<Button type="submit" class="w-full" disabled={$submitting}>
							{$submitting ? 'Memproses...' : 'Daftar'}
						</Button>
					</form>
				{/if}
			</Card.Content>
			<Card.Footer class="justify-center">
				<p class="text-sm text-muted-foreground">
					Sudah punya akun?
					<a href="/auth/sign-in" class="font-medium underline underline-offset-2">Masuk</a>
				</p>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
