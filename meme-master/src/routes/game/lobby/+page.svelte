<script lang="ts">
	import type { Game } from '$lib/Game.svelte.js';
	import { fetchWithAuth, getUser, signIn } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import { getGame } from '../game.client.svelte';
	import Button from '../../Button.svelte';
	import Participant from '$lib/components/Participant/Participant.svelte';

	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import clsx from 'clsx';

	let user = $derived(getUser());
	let game: Game | undefined = $derived(getGame());
	let gameId = $derived(game?.uid);
	let gameCode = $derived(game?.code);
	let remainingSpots = $derived(9 - (game?.participants.length ?? 0));

	let gameStatus = $derived(game?.status);
	onMount(() => {
		if (!user && auth) {
			signIn(auth);
		}
	});

	$effect(() => {
		if (gameId && gameCode) {
			if (gameStatus !== 'waiting') {
				goto(`/game/play?gameId=${gameId}&gameCode=${gameCode}`);
			}
		}
	});
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

<div class="flex grow flex-col items-center justify-center gap-3 p-3 lg:gap-10">
	<div class="flex h-full grow flex-col justify-center gap-3 md:w-[400px] lg:w-[500px] lg:gap-10">
		<div
			class="grid max-h-[20em] grow grid-flow-row grid-cols-3 grid-rows-3 gap-2 overflow-auto lg:gap-4"
		>
			<!--Participants-->
			{#if game?.participants}
				{#each game?.participants as participant, i (i)}
					<Participant
						{participant}
						class={clsx(participant.user === user?.uid && 'bg-red-100 p-2 drop-shadow-lg')}
					/>
				{/each}
			{/if}
			{#each Array(remainingSpots).fill(0) as _, i}
				<div class="rounded-md bg-gray-300 bg-opacity-30"></div>
			{/each}
		</div>
		<div class="flex items-center justify-between gap-3 py-3">
			<div>
				<h1 class="font-black">Game Code</h1>
				<div class="flex flex-row gap-2 py-2">
					{#each gameCode?.split('') ?? [] as c, i}
						<span class="h-fit w-fit rounded-md bg-amber-200 p-1 px-2 text-3xl font-semibold"
							>{c}</span
						>
					{/each}
				</div>
			</div>
			<Button
				class="self-end"
				onclick={() => {
					startGame();
				}}
			>
				{#if game?.status !== 'waiting'}
					View Game
				{:else}
					Start Game
				{/if}
			</Button>
		</div>
	</div>
</div>
