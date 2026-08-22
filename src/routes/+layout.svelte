<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import UpdateToast from '$lib/components/UpdateToast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0f172a" />
</svelte:head>

{@render children()}
<UpdateToast />
