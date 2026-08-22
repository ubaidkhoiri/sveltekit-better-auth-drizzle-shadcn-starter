<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let signingOut = $state(false);

	async function signOut() {
		signingOut = true;
		await authClient.signOut();
		await goto('/');
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-sm text-muted-foreground">
			Masuk sebagai <span class="font-medium text-foreground">{data.user.name}</span>
			({data.user.email})
		</p>
	</header>

	<Card.Root>
		<Card.Header>
			<Card.Title>Cek API terproteksi</Card.Title>
			<Card.Description>Contoh endpoint dengan validasi + sanitasi + session check.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground">
				Endpoint <code class="rounded bg-muted px-1">POST /api/example</code> memvalidasi input
				dengan Zod dan hanya menerima request dengan session aktif.
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Setup &amp; Diagnostik</Card.Title>
			<Card.Description>Panduan langkah demi langkah + tes alur login otomatis satu klik.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			<a
				href="/setup"
				class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
			>
				Buka halaman setup
			</a>
			{#if data.user.role === 'owner' || data.user.role === 'admin'}
				<a
					href="/dashboard/settings"
					class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
				>
					Pengaturan login
				</a>
			{/if}
		</Card.Content>
	</Card.Root>

	<Button type="button" variant="destructive" onclick={signOut} disabled={signingOut} class="w-full">
		{signingOut ? 'Keluar...' : 'Keluar'}
	</Button>
</main>
