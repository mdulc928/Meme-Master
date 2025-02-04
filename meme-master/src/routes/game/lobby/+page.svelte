<script lang="ts">
	import type { Game } from '$lib/Game.svelte.js';
	import { fetchWithAuth, getUser, signIn } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import { getGame } from '../../../lib/game.client.svelte';
	import Button from '../../Button.svelte';
	import Participant from '$lib/components/Participant/Participant.svelte';

	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import clsx from 'clsx';
	import { twMerge } from 'tailwind-merge';

	let user = $derived(getUser());
	let game: Game | undefined = $derived(getGame());
	let sortedParticipants = $derived(game?.participants?.toSorted((a, b) => b.points - a.points));

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
			if (
				['deciding', 'voting'].includes(gameStatus ?? '') &&
				game?.participants.some((p) => p.user === user?.uid)
			) {
				goto(`/game/play?gameId=${gameId}&gameCode=${gameCode}`);
			}
		}
	});
	async function startGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if (
			game?.participants.some((p) => p.user === user?.uid) &&
			['deciding', 'voting'].includes(gameStatus ?? '')
		) {
			goto(`/game/play?gameId=${gameId}&gameCode=${gameCode}`);
		} else if (!game?.participants.some((p) => p.user === user?.uid)) {
			// this should never happen
			return;
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
			{#if game?.participants || sortedParticipants}
				{#each (gameStatus === 'ended' ? sortedParticipants : game?.participants) ?? [] as participant, i (i)}
					<Participant
						{participant}
						class={clsx(
							participant.user === user?.uid && 'bg-red-100 p-2 drop-shadow-lg',
							gameStatus === 'ended' &&
								participant.points === sortedParticipants?.[0].points &&
								'bg-purple-300 [&_.points]:h-fit [&_.points]:rounded [&_.points]:bg-yellow-300 [&_.points]:px-2 [&_.points]:py-1  [&_.points]:font-bold'
						)}
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
			{#if game}
				{#if game.participants.some((p) => p.user === user?.uid) && gameStatus !== 'ended'}
					{#if game.participants.length < 3}
						<div class="text-wrap">
							👈 Invite (at least 😁) {3 - game.participants.length} more {3 -
								game.participants.length >
							1
								? 'peeps'
								: 'peep'} to join with this game code to play! Have fun 🤗
						</div>
					{:else if gameStatus === 'waiting' && game.participants.length >= 3 && game.createdBy !== user?.uid}
						<div class="text-wrap">
							Waiting for {game.participants.find((p) => p.user === game.createdBy)?.nickname ??
								' the game creator '} to start the game. 😒 (You can keep inviting more people)
						</div>
					{:else if gameStatus === 'waiting' && game.createdBy === user?.uid}
						<Button
							class="self-end"
							onclick={() => {
								startGame();
							}}
						>
							Start Game
						</Button>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
</div>
