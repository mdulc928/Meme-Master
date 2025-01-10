<script lang="ts">
	import type { Game } from '$lib/Game.svelte.js';
	import { fetchWithAuth, getUser, signIn } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import { getGame } from '../game.client.svelte';
	import Button from '../../Button.svelte';
	import Participant from '$lib/components/Participant/Participant.svelte';

	import { goto } from '$app/navigation';

	let user = $derived(getUser());
	let game: Game | undefined = $derived(getGame());
	let gameId = $derived(game?.uid);
	let gameCode = $derived(game?.code);

	async function startGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if (!gameId || !((gameId?.length ?? 0) > 0)) {
			throw new Error('Game id not set.');
		}

		const response = await fetchWithAuth(authedUser, '/api/game/start', {
			method: 'POST',
			body: JSON.stringify({
				gameId
			})
		});

		if (response.ok) {
			goto(`/game/play?gameId=${gameId}&gameCode=${gameCode}`);
		}
	}
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
		<Button
			onclick={() => {
				startGame();
			}}>Start Game</Button
		>
	</div>
</div>
