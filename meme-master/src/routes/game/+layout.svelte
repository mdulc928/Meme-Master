<script lang="ts">
	import { getUser, signIn } from '$lib/utils/auth.client.svelte';
	import { onMount } from 'svelte';
	import { createGameStateListener } from '../../lib/game.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import { browser } from '$app/environment';

	const urlSearchParams = browser ? new URLSearchParams(location.search) : undefined;
	let gameId = $state(urlSearchParams?.get('gameId') ?? undefined);
	let user = $derived(getUser());

	onMount(() => {
		if (user === undefined && auth) {
			signIn(auth);
		}
	});

	$effect(() => {
		console.log('getting game state');
		if (!gameId || !user || !browser) {
			return;
		}
		const unsubscribe = createGameStateListener({
			gameId
		});

		return unsubscribe;
	});

	let { children } = $props();
</script>

{#if user !== undefined}
	{@render children?.()}
{:else}
	<div>hello</div>
{/if}
