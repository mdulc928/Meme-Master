<script lang="ts">
	import { getUser } from '$lib/utils/auth.client.svelte';
	import {
		fetchRoundImage,
		fetchUserCards,
		fetchUserSubmission,
		getGame,
		getLastRoundWinner,
		getRoundImage,
		getUserSubmission,
		setLastRoundWinner,
		setRoundImage,
		setUserCurrentCards,
		setUserSubmission,
		startVotingRound,
		submitVote
	} from '$lib/game.client.svelte';
	import DecidingView from './DecidingView.svelte';
	import VotingView from './VotingView.svelte';
	import EndGameView from './EndGameView.svelte';
	import { createSubmissionsListener } from '$lib/submissions.client.svelte';
	import clsx from 'clsx';
	import type { Submission } from '$lib/Game.svelte';
	import { twMerge } from 'tailwind-merge';
	import { JUGDE_POINTS, PLAYER_POINTS } from '$lib/utils';
	import Button from '../../Button.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	let user = $derived(getUser());
	let game = $derived(getGame());
	let participants = $derived(game?.participants);

	let gamePlayer = $derived(
		game?.participants?.find((participant) => participant.user === user?.uid)
	);
	let round = $derived(game?.round);
	let gameId = $derived(game?.uid);
	let gameStatus = $derived(game?.status);
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

	let selectedCaption = $state<Submission | undefined>();

	let notifyingRoundWinner = $state<number | undefined>();
	let lastRoundWinner = $derived(getLastRoundWinner());

	$effect.pre(() => {
		if (gameStatus === 'deciding' && lastRoundWinner !== undefined) {
			notifyingRoundWinner = window.setTimeout(() => {
				notifyingRoundWinner = undefined;
				setLastRoundWinner(undefined);
			}, 10000);
		}
		return () => {
			window.clearTimeout(notifyingRoundWinner);
		};
	});
</script>

{#snippet winnerBanner()}
	{#if lastRoundWinner !== undefined && round}
		{#key notifyingRoundWinner}
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<div
				transition:fly
				class={clsx(
					'absolute left-0 right-0 top-8 z-[1000] flex max-w-[400px] justify-between gap-5 rounded-md bg-green-700 p-3 text-2xl font-bold text-white shadow-md drop-shadow-lg',
					notifyingRoundWinner !== undefined && 'animate-pulse'
				)}
			>
				<span>{lastRoundWinner}</span> won round {round - 1}!
				<button
					onclick={() => {
						window.clearTimeout(notifyingRoundWinner);
						setLastRoundWinner(undefined);
						notifyingRoundWinner = undefined;
					}}><i class="fas fa-xmark"></i></button
				>
			</div>
		{/key}
	{/if}
{/snippet}

{#if user}
	{#if gameStatus === 'ended'}
		<EndGameView />
	{:else}
		{@render winnerBanner()}
		<div class="flex h-full w-full flex-col items-center justify-center px-3 py-5">
			<div class="max-h-1/3 relative max-w-[30em]">
				<img src={image?.url} alt="the meme" class="overflow-hidden rounded-t-lg rounded-bl-lg" />
				<div
					class="text absolute bottom-0 right-0 rounded-b-lg bg-lime-500 bg-opacity-30 px-3 font-extrabold"
				>
					<span class="text-xs font-normal">Image Cards Won:</span>
					{gamePlayer?.cardsWon?.length}
				</div>
				<div>
					<span class="text-xs font-normal">Round:</span>
					{round ?? '-'}
					{#if gameStatus === 'voting'}
						<span class="text-xs">You may need to scroll</span>
					{/if}
				</div>
			</div>
			<div class={clsx('flex w-full max-w-[30em] grow flex-col items-center')}>
				{#if gameStatus === 'deciding' && !isJudge && userSubmission === undefined}
					<DecidingView {user} bind:currentIndex={currentCaptionIndex} />
				{:else if gameStatus === 'voting' || isJudge || userSubmission !== undefined}
					<VotingView {user}>
						{#snippet votingView({
							totalPoints,
							pointsUsed,
							submissions,
							submittedCaptions,
							userSubmission
						})}
							<!--judges only see this the entire round-->
							<!--also the whole card is not fectched since we don't want to leak the card.-->
							<div class="relative flex w-full grow flex-col items-center gap-3 overflow-auto py-3">
								<div class="flex w-full justify-center gap-7">
									<div class="flex items-end gap-2">
										<span class="text-sm">Role</span>
										<span
											class={clsx(
												isJudge ? 'bg-red-300' : 'bg-amber-300',
												'rounded-lg px-2 font-semibold'
											)}
										>
											{isJudge ? 'Judge' : 'Jury'}
										</span>
									</div>
									<div class="flex items-end gap-2">
										<span class="text-sm">Points Used</span>
										<span class="font-semibold underline underline-offset-4"
											>{pointsUsed}/{totalPoints}</span
										>
										<!--This will be calculated by the submissions the user has voted for.-->
									</div>
								</div>
								<div class="flex w-full grow flex-col gap-3 overflow-auto">
									<!--for each submission,then show the caption submitted.-->
									{#each submissions ?? [] as submission, i (i)}
										<button
											class={twMerge(
												clsx(
													'w-full rounded-lg bg-blue-200 p-2',
													selectedCaption === submission &&
														'border-2 bg-blue-400 font-semibold tracking-wide text-white',
													userSubmission?.caption === submission.caption &&
														'bg-gray-100 text-gray-400 '
												)
											)}
											onclick={async () => {
												if (gameId && user && gameStatus === 'voting' && !isJudge) {
													await submitVote({
														gameId,
														user,
														points: PLAYER_POINTS,
														captionId: submission.caption
													});
												} else if (isJudge && gameStatus === 'voting') {
													selectedCaption = submission;
												}
											}}
										>
											<div
												class={clsx(
													'w-full text-left',
													!submittedCaptions?.has(submission.caption) && 'blur-md'
												)}
											>
												{submittedCaptions?.get(submission.caption)?.text ?? submission.caption}
											</div>
											<div class="flex w-full justify-center">
												<span
													class={twMerge(
														clsx(
															'rounded-lg bg-blue-700 px-2 py-1 text-center text-2xl font-extrabold text-amber-300 shadow ease-linear'
														)
													)}
												>
													{submission.points.reduce((all, curr) => {
														return all + curr.amount;
													}, 0)}
												</span>
											</div>
										</button>
									{/each}
								</div>
								<div class="flex w-full justify-center gap-3 bg-white px-3 py-3">
									{#if isJudge && gameStatus === 'voting'}
										<div class="flex items-center gap-2 text-wrap break-words">
											Choose the winner by clicking on the caption and then clicking this button.
										</div>
										<Button
											class="bg-amber-300"
											onclick={async () => {
												if (
													gameId &&
													user &&
													gameStatus === 'voting' &&
													isJudge &&
													selectedCaption
												) {
													await submitVote({
														gameId,
														user,
														points: JUGDE_POINTS * (participants?.length ?? 0),
														captionId: selectedCaption.caption
													});
												}
											}}>Choose Winner</Button
										>
									{:else if gameStatus === 'voting'}
										<div class="text-wrap">
											Award points by clicking on the caption: 1 click = {PLAYER_POINTS}pts. You can
											give as many points to you have to 1 card.
										</div>
									{:else}
										{#if isJudge}
											<Button
												class="h-fit py-2"
												onclick={() => {
													if (gameId && user) {
														startVotingRound({
															gameId,
															user
														});
													}
												}}>Start Voting Round</Button
											>
										{/if}
										<div>Waiting for everyone to submit a caption.</div>
									{/if}
								</div>
							</div>
						{/snippet}
					</VotingView>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div>You should not be here.</div>
{/if}
