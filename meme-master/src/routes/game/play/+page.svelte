<script lang="ts">
	import { getUser } from '$lib/utils/auth.client.svelte';
	import {
		fetchRoundImage,
		fetchUserCards,
		fetchUserSubmission,
		getGame,
		getRoundImage,
		getUserSubmission,
		setRoundImage,
		setUserCurrentCards,
		setUserSubmission
	} from '../game.client.svelte';
	import DecidingView from './DecidingView.svelte';
	import VotingView from './VotingView.svelte';
	import EndGameView from './EndGameView.svelte';
	import { createSubmissionsListener } from '../submissions.client.svelte';

	let user = $derived(getUser());
	let game = $derived(getGame());
	let gamePlayer = $derived(
		game?.participants?.find((participant) => participant.user === user?.uid)
	);
	let round = $derived(game?.round);
	let gameId = $derived(game?.uid);
	let view = $derived(game?.status);
	let image = $derived(getRoundImage());

	let isJudge = $derived.by(() => {
		return !!game?.participants?.some(
			(participant) => participant.user === user?.uid && participant.role === 'judge'
		);
	});

	$effect.pre(() => {
		if (round !== undefined && gameId !== undefined && user) {
			fetchRoundImage({ user, gameId }).then((memeImage) => {
				setRoundImage(memeImage);
			});
		}
	});

	$effect.pre(() => {
		if (gameId && round !== undefined && !isJudge && user) {
			fetchUserCards({ user, gameId }).then((captions) => {
				setUserCurrentCards(captions);
			});
		}
	});

	let userSubmission = $derived(getUserSubmission());
	$effect.pre(() => {
		if (userSubmission === undefined && user && gameId) {
			fetchUserSubmission({ gameId, user: user }).then((submission) => {
				setUserSubmission(submission);
			});
		}
	});

	// this is rotating index. We allow them to keep pressing 1 button,
	// and when we reach the end of list of cards we just mod that.

	let currentCaptionIndex: number = $state(0);
	$effect.pre(() => {
		if (
			(isJudge && gameId && round !== undefined) ||
			(userSubmission !== undefined && gameId && round !== undefined)
		) {
			return createSubmissionsListener({ gameId, gameRound: round });
		}
	});
</script>

{#if user}
	{#if view === 'ended'}
		<EndGameView />
	{:else}
		<div
			class="relative flex h-full w-full flex-col items-center justify-center overflow-auto px-3 py-5"
		>
			<div
				class="text absolute right-4 top-0 rounded-lg bg-green-300 bg-opacity-50 p-2 px-3 font-extrabold lg:right-1/4"
			>
				{gamePlayer?.cardsWon?.length}
			</div>
			<div class="max-h-1/3 max-w-[30em] overflow-hidden rounded-lg">
				<img src={image?.url} alt="the meme" />
			</div>
			<div class="max-h-2/3 flex w-full max-w-[30em] grow flex-col items-center overflow-auto">
				{#if view === 'deciding' && !isJudge && userSubmission === undefined}
					<DecidingView {user} bind:currentIndex={currentCaptionIndex} />
				{:else if view === 'voting' || isJudge || userSubmission !== undefined}
					<VotingView {user} />
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div>You should not be here.</div>
{/if}
