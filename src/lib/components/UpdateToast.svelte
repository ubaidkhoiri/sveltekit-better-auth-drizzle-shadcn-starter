<script lang="ts">
	import { registerSW } from 'virtual:pwa-register';
	import { Button } from '$lib/components/ui/button';

	let needRefresh = $state(false);

	const updateSW = registerSW({
		immediate: true,
		onNeedRefresh() {
			needRefresh = true;
		}
	});
</script>

{#if needRefresh}
	<div
		class="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 shadow-lg"
	>
		<p class="text-sm">Versi baru tersedia.</p>
		<div class="flex gap-2">
			<Button size="sm" variant="ghost" onclick={() => (needRefresh = false)}>Nanti</Button>
			<Button size="sm" onclick={() => updateSW(true)}>Muat ulang</Button>
		</div>
	</div>
{/if}
