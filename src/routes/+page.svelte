<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<title>SvelteKit PWA Starter</title>
	<link rel="icon" href={favicon} />
	<meta name="description" content="Boilerplate PWA: SvelteKit + Better Auth + Drizzle + shadcn-svelte" />
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10 text-center">
	<div class="space-y-3">
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">SvelteKit PWA Starter</h1>
		<p class="max-w-sm text-sm text-slate-600">
			Mobile-first boilerplate dengan Better Auth, Drizzle ORM (NeonDB), shadcn-svelte,
			Superforms + Zod, rate limiting Upstash, dan PWA Cache First.
		</p>
	</div>

	<div class="flex w-full max-w-xs flex-col gap-3">
		<a
			href="/auth/sign-up"
			class="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
		>
			Mulai — Daftar
		</a>
		<a
			href="/dashboard"
			class="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
		>
			Dashboard
		</a>
	</div>

	<a href="/setup" class="text-xs text-slate-500 underline underline-offset-4 hover:text-slate-700">
		Panduan setup &amp; tes diagnostik
	</a>

	<p class="text-xs text-slate-400">Installable &amp; offline-ready via service worker</p>
</main>
