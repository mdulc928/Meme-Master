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
		setUserSubmission,
		submitVote
	} from '../game.client.svelte';
	import DecidingView from './DecidingView.svelte';
	import VotingView from './VotingView.svelte';
	import EndGameView from './EndGameView.svelte';
	import { createSubmissionsListener } from '../submissions.client.svelte';
	import clsx from 'clsx';
	import type { Submission } from '$lib/Game.svelte';
	import { twMerge } from 'tailwind-merge';
	import { JUGDE_POINTS, PLAYER_POINTS } from '../utils';
	import Button from '../../Button.svelte';

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
	let hideCardWonLabel = $state(true);

	let selectedCaption = $state<Submission | undefined>();
</script>

{#if user}
	{#if gameStatus === 'ended'}
		<EndGameView />
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center px-3 py-5">
			<div class="max-h-1/3 relative max-w-[30em]">
				<img src={image?.url} alt="the meme" class="overflow-hidden rounded-lg" />
				<button
					class="text absolute bottom-0 left-0 rounded-lg bg-green-400 bg-opacity-70 px-3 font-extrabold"
					onclick={() => {
						hideCardWonLabel = !hideCardWonLabel;
						setTimeout(() => {
							hideCardWonLabel = true;
						}, 5000);
					}}
				>
					{#if !hideCardWonLabel}
						<span class="text-normal font-normal">Cards Won:</span>
					{/if}
					{gamePlayer?.cardsWon?.length}
				</button>
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
								<div class="flex w-full justify-center gap-3">
									<span
										class={clsx(
											isJudge ? 'bg-red-300' : 'bg-amber-300',
											'rounded-full px-2 font-semibold'
										)}
									>
										{isJudge ? 'Judge' : 'Jury'}
									</span>
									<div>
										Points Used: {pointsUsed}/{totalPoints}
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
										<div>Award points by clicking on the caption: 1 click = {PLAYER_POINTS}pts</div>
									{:else}
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
