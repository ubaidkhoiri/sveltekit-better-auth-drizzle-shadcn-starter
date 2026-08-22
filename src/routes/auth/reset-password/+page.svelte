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
	<title>Atur Ulang Password</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
	<div class="w-full max-w-sm space-y-6">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-2xl">Atur Ulang Password</Card.Title>
				<Card.Description>Buat password baru untuk akun Anda</Card.Description>
			</Card.Header>

			{#if !$formData.token}
				<Card.Content class="space-y-4">
					<p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
						Token reset tidak ditemukan pada tautan. Minta tautan reset yang baru.
					</p>
					<Button variant="outline" class="w-full" href="/auth/forgot-password">
						Minta tautan baru
					</Button>
				</Card.Content>
			{:else}
				<Card.Content class="space-y-4">
					{#if $message}
						<p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{$message}</p>
					{/if}

					<form method="POST" use:enhance class="space-y-4">
						<input type="hidden" name="token" bind:value={$formData.token} />

						<div class="space-y-1.5">
							<Label for="password">Password baru</Label>
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

						<div class="space-y-1.5">
							<Label for="confirmPassword">Konfirmasi password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autocomplete="new-password"
								minlength={8}
								required
								bind:value={$formData.confirmPassword}
							/>
							{#if $errors.confirmPassword}
								<p class="text-xs text-destructive">{$errors.confirmPassword}</p>
							{/if}
						</div>

						<Button type="submit" class="w-full" disabled={$submitting}>
							{$submitting ? 'Memproses...' : 'Simpan password baru'}
						</Button>
					</form>
				</Card.Content>
			{/if}

			<Card.Footer class="justify-center">
				<p class="text-sm text-muted-foreground">
					<a href="/auth/sign-in" class="font-medium underline underline-offset-2">Kembali ke Masuk</a>
				</p>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
