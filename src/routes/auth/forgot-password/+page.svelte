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
	<title>Lupa Password</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
	<div class="w-full max-w-sm space-y-6">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-2xl">Lupa Password</Card.Title>
				<Card.Description>Masukkan email Anda dan kami kirim tautan reset</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if data.adminReset}
					<p class="rounded-md bg-muted px-3 py-2 text-sm">
						Reset password pada app ini dilakukan manual oleh admin. Hubungi admin untuk mengatur ulang
						password Anda.
					</p>
				{/if}
				{#if $message}
					<p class="rounded-md bg-muted px-3 py-2 text-sm">{$message}</p>
				{/if}

				{#if !data.adminReset}
					<form method="POST" use:enhance class="space-y-4">
						<div class="space-y-1.5">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={$formData.email}
							/>
							{#if $errors.email}<p class="text-xs text-destructive">{$errors.email}</p>{/if}
						</div>

						<Button type="submit" class="w-full" disabled={$submitting}>
							{$submitting ? 'Memproses...' : 'Kirim tautan reset'}
						</Button>
					</form>
				{/if}
			</Card.Content>
			<Card.Footer class="justify-center">
				<p class="text-sm text-muted-foreground">
					<a href="/auth/sign-in" class="font-medium underline underline-offset-2">Kembali ke Masuk</a>
				</p>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
