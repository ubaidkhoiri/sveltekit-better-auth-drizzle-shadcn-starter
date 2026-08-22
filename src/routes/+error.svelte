<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>{page.status} • Starter</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center px-4 text-center">
	<p class="text-7xl font-semibold tracking-tight">{page.status}</p>
	<h1 class="mt-3 text-lg font-medium text-muted-foreground">
		{page.error?.message ?? 'Terjadi kesalahan.'}
	</h1>
	<a href="/" class={buttonVariants({ variant: 'outline', class: 'mt-6 w-full max-w-xs' })}>
		Kembali ke Beranda
	</a>
</div>
