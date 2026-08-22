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
	const identifierLabel = flags.usernameLogin ? 'Email atau username' : 'Email';

	const { form: formData, errors, enhance, submitting, message } = superForm(data.form);

	function signInWithGoogle() {
		void authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
	}
</script>

<svelte:head>
	<title>Masuk</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
	<div class="w-full max-w-sm space-y-6">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-2xl">Masuk</Card.Title>
				<Card.Description>Selamat datang kembali</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if $message}
					<p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{$message}</p>
				{/if}

				{#if showGoogle}
					<Button type="button" variant="outline" class="w-full" onclick={signInWithGoogle}>
						Lanjut dengan Google
					</Button>
				{/if}

				{#if showPassword && showGoogle}
					<div class="flex items-center gap-3">
						<Separator class="flex-1" />
						<span class="text-xs text-muted-foreground">atau masuk dengan kredensial</span>
						<Separator class="flex-1" />
					</div>
				{/if}

				{#if showPassword}
					<form method="POST" use:enhance class="space-y-4">
						<div class="space-y-1.5">
							<Label for="email">{identifierLabel}</Label>
							<Input id="email" name="email" type="text" autocomplete="username" required bind:value={$formData.email} />
							{#if $errors.email}<p class="text-xs text-destructive">{$errors.email}</p>{/if}
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label for="password">Password</Label>
								{#if flags.resetMode === 'email'}
									<a href="/auth/forgot-password" class="text-xs font-medium underline underline-offset-2">
										Lupa password?
									</a>
								{/if}
							</div>
							<Input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={$formData.password}
							/>
							{#if $errors.password}<p class="text-xs text-destructive">{$errors.password}</p>{/if}
						</div>

						<Button type="submit" class="w-full" disabled={$submitting}>
							{$submitting ? 'Memproses...' : 'Masuk'}
						</Button>
					</form>
				{/if}
			</Card.Content>
			{#if flags.signupEnabled}
				<Card.Footer class="justify-center">
					<p class="text-sm text-muted-foreground">
						Belum punya akun?
						<a href="/auth/sign-up" class="font-medium underline underline-offset-2">Daftar</a>
					</p>
				</Card.Footer>
			{:else}
				<Card.Footer class="justify-center">
					<p class="text-xs text-muted-foreground">Pendaftaran ditutup — akun dibuat oleh admin.</p>
				</Card.Footer>
			{/if}
		</Card.Root>
	</div>
</main>
