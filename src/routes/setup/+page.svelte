<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface Check {
		id: string;
		label: string;
		status: 'ok' | 'warn' | 'fail';
		detail: string;
		fix?: string;
	}
	interface StepResult {
		step: string;
		ok: boolean;
		note?: string;
	}

	let checks: Check[] = $state(data.checks);
	let rechecking = $state(false);
	let selftestRunning = $state(false);
	let steps: StepResult[] = $state([]);
	let selftestDone = $state(false);

	const statusMeta: Record<Check['status'], { label: string; class: string }> = {
		ok: { label: 'OK', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
		warn: { label: 'PERHATIAN', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
		fail: { label: 'GAGAL', class: 'bg-red-500/15 text-red-600 dark:text-red-400' }
	};

	const okCount = $derived(checks.filter((c) => c.status === 'ok').length);
	const failCount = $derived(checks.filter((c) => c.status === 'fail').length);
	const warnCount = $derived(checks.filter((c) => c.status === 'warn').length);

	async function recheck() {
		rechecking = true;
		try {
			const res = await fetch('/api/setup/checks');
			if (res.ok) checks = (await res.json()).checks;
		} finally {
			rechecking = false;
		}
	}

	async function runSelftest() {
		selftestRunning = true;
		steps = [];
		selftestDone = false;
		try {
			const res = await fetch('/api/setup/selftest', { method: 'POST' });
			if (res.ok) {
				steps = (await res.json()).steps;
				selftestDone = true;
			}
		} finally {
			selftestRunning = false;
		}
	}
</script>

<svelte:head>
	<title>Setup &amp; Diagnostik</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Setup &amp; Diagnostik</h1>
		<p class="text-sm text-muted-foreground">
			Ikuti langkah dari atas ke bawah. Semua indikator hijau = siap dipakai.
		</p>
	</header>

	<Card.Root>
		<Card.Content class="flex items-center justify-between gap-3 pt-6">
			<div class="text-sm">
				<p class="font-medium">
					{okCount} OK
					{#if warnCount > 0}<span class="text-amber-500"> · {warnCount} perhatian</span>{/if}
					{#if failCount > 0}<span class="text-red-500"> · {failCount} gagal</span>{/if}
				</p>
				<p class="text-muted-foreground">
					{failCount === 0 ? 'Fungsi inti berjalan.' : 'Perbaiki item merah terlebih dahulu.'}
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={recheck} disabled={rechecking}>
				{rechecking ? 'Memeriksa...' : 'Tes ulang'}
			</Button>
		</Card.Content>
	</Card.Root>

	{#each checks as check (check.id)}
		<Card.Root>
			<Card.Content class="space-y-2 pt-6">
				<div class="flex items-start justify-between gap-3">
					<p class="text-sm font-medium leading-snug">{check.label}</p>
					<span
						class="rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap {statusMeta[check.status].class}"
					>
						{statusMeta[check.status].label}
					</span>
				</div>
				<p class="text-sm text-muted-foreground">{check.detail}</p>
				{#if check.fix && check.status !== 'ok'}
					<p class="rounded-md bg-muted p-3 text-xs leading-relaxed">
						<span class="font-semibold">Cara memperbaiki:</span> {check.fix}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/each}

	<Card.Root>
		<Card.Header>
			<Card.Title>Tes alur otomatis</Card.Title>
			<Card.Description>
				Satu klik: daftar akun sementara → masuk → verifikasi sesi → hapus lagi. Aman, tidak
				meninggalkan data.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-3">
			<Button onclick={runSelftest} disabled={selftestRunning} class="w-full">
				{selftestRunning ? 'Menjalankan tes...' : 'Jalankan tes daftar + masuk'}
			</Button>
			{#if steps.length > 0}
				<ul class="space-y-1.5 text-sm">
					{#each steps as step (step.step)}
						<li class="flex items-start gap-2">
							<span class={step.ok ? 'text-emerald-500' : 'text-red-500'}>
								{step.ok ? '✓' : '✗'}
							</span>
							<span>
								{step.step}
								{#if step.note}<span class="block text-xs text-muted-foreground">{step.note}</span>{/if}
							</span>
						</li>
					{/each}
				</ul>
				{#if selftestDone}
					<p class="text-xs text-muted-foreground">
						Selesai. Tekan "Tes ulang" di atas untuk menyegarkan indikator.
					</p>
				{/if}
			{/if}
		</Card.Content>
	</Card.Root>

	<footer class="pb-4 text-center text-xs text-muted-foreground">
		Halaman ini hanya untuk pemilik app — tidak mengeksplorasi secret apa pun.
	</footer>
</main>
