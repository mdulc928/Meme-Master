<script lang="ts">
	import type { Game } from '$lib/Game.svelte.js';
	import { getUser, setUser, signIn } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import { onMount } from 'svelte';
	import { createGameStateListener } from './game.client.svelte';
	import Button from '../Button.svelte';
	import Participant from '$lib/components/Participant/Participant.svelte';
	import { browser } from '$app/environment';

	const urlSearchParams = browser ? new URLSearchParams(location.search) : undefined;
	let gameCode = $state(urlSearchParams?.get('gameCode') ?? undefined);
	let gameId = $state(urlSearchParams?.get('gameId') ?? undefined);

	let user = $derived(getUser());
	let game: Game | undefined = $state();
	onMount(() => {
		if (user === undefined && auth) {
			signIn(auth);
		}
	});

	$effect(() => {
		if (!gameId) {
			return;
		}

		const unsubscribe = createGameStateListener({
			gameId,
			callback(updatedGame) {
				console.log('got an update to the game');
				game = updatedGame;
			}
		});

		return unsubscribe;
	});

	async function startGame() {}
</script>

<div class="flex h-full w-full grow flex-col">
	<div class="grid grow overflow-auto">
		<!--Participants-->
		{#if game?.participants}
			{#each game?.participants as participant, i (i)}
				<Participant {participant} />
			{/each}
		{/if}
	</div>
	<div class="flex self-end">
		<Button>Start Game</Button>
	</div>
</div>
