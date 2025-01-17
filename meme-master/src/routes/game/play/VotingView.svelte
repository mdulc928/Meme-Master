<script lang="ts">
	import type { User } from '@firebase/auth';
	import {
		addSubmittedCaption,
		getCaptionCard,
		getGame,
		getSubmittedCaptions,
		getUserSubmission,
		submitVote
	} from '../game.client.svelte';
	import { getSubmissions } from '../submissions.client.svelte';
	import Button from '../../Button.svelte';
	import clsx from 'clsx';
	import type { Submission } from '$lib/Game.svelte';
	import { twMerge } from 'tailwind-merge';
	import { JUGDE_POINTS, MAX_PLAYER_POINTS, MIN_PLAYER_POINTS, PLAYER_POINTS } from '../utils';

	let { user }: { user: User } = $props();
	let game = $derived(getGame());
	let participants = $derived(game?.participants);
	let gameId = $derived(game?.uid);
	let round = $derived(game?.round);
	let status = $derived(game?.status);

	let isJudge = $derived.by(() => {
		return !!game?.participants?.some(
			(participant) => participant.user === user?.uid && participant.role === 'judge'
		);
	});

	let submissions = $derived(getSubmissions());
	let submissionsLength = $derived(submissions?.length ?? 0);
	// it's be cool to add that one day user can spectate and so they see what everyone has.
	let userSubmission = $derived.by(() => {
		return submissions?.find((submission) => submission.uid === getUserSubmission());
	});

	let submittedCaptions = $derived(getSubmittedCaptions());
	let submittedCaptionsLength = $derived(submittedCaptions?.size ?? 0);
	$effect.pre(() => {
		if (userSubmission !== undefined && !submittedCaptions?.has(userSubmission.caption)) {
			getCaptionCard({ captionId: userSubmission.caption }).then((caption) => {
				addSubmittedCaption(caption);
			});
		}
	});

	$effect.pre(() => {
		if (status === 'voting' && submissionsLength !== submittedCaptionsLength) {
			const getCaptionCardPromises = submissions
				?.filter((submission) => !submittedCaptions?.has(submission.caption))
				?.map((submission) => {
					return getCaptionCard({ captionId: submission.caption });
				});

			if (!getCaptionCardPromises) return;

			Promise.all(getCaptionCardPromises).then((captions) => {
				captions.forEach((caption) => {
					addSubmittedCaption(caption);
				});
			});
		}
	});

	let selectedCaption = $state<Submission | undefined>();

	function calculateTotalUsed() {
		let totalPointsUsed = 0;
		submissions?.forEach((submission) => {
			totalPointsUsed += submission.points.reduce((all, curr) => {
				if (curr.user === user?.uid) {
					return all + curr.amount;
				}
				return all;
			}, 0);
		});
		return totalPointsUsed;
	}

	const totalPoints = $derived.by(() => {
		const participantLength = participants?.length ?? 0;
		if (isJudge) {
			return JUGDE_POINTS * participantLength;
		} else if (participantLength > 0) {
			// player minus themselves and the jussssdafdge.
			return Math.min(MAX_PLAYER_POINTS, MIN_PLAYER_POINTS * (participantLength - 2));
		}
	});
</script>

<!--judges only see this the entire round-->
<!--also the whole card is not fectched since we don't want to leak the card.-->
<div class="relative flex w-full grow flex-col items-center gap-3 overflow-auto py-3">
	<div class="flex w-full justify-center gap-3">
		<span
			class={clsx(isJudge ? 'bg-red-300 font-extrabold' : 'bg-amber-300', 'rounded-lg px-2 py-1')}
		>
			{isJudge ? 'Judge' : 'Jury'}
		</span>
		<div>
			Points Used: {calculateTotalUsed()}/{totalPoints}
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
						selectedCaption === submission && 'border-2 bg-amber-300',
						userSubmission?.caption === submission.caption && 'bg-gray-100 text-gray-400 '
					)
				)}
				onclick={async () => {
					if (gameId && user && status === 'voting' && !isJudge) {
						await submitVote({
							gameId,
							user,
							points: PLAYER_POINTS,
							captionId: submission.caption
						});
					} else if (isJudge && status === 'voting') {
						selectedCaption = submission;
					}
				}}
			>
				<div
					class={clsx('w-full text-left', !submittedCaptions?.has(submission.caption) && 'blur-md')}
				>
					{submittedCaptions?.get(submission.caption)?.text ?? submission.caption}
				</div>
				<div class="flex w-full justify-center">
					<span
						class={twMerge(
							clsx(
								'rounded-lg bg-purple-500 px-2 py-1 text-center text-2xl font-extrabold text-amber-300'
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
	<div class="sticky bottom-0 flex w-full justify-center gap-3 bg-white py-3">
		{#if isJudge && status === 'voting'}
			<Button
				class="bg-amber-300"
				onclick={async () => {
					if (gameId && user && status === 'voting' && isJudge && selectedCaption) {
						await submitVote({
							gameId,
							user,
							points: JUGDE_POINTS * (participants?.length ?? 0),
							captionId: selectedCaption.caption
						});
					}
				}}>Choose Winner</Button
			>
		{:else if status === 'voting'}
			<div>Award points by clicking on the caption: 1 click = {PLAYER_POINTS}pts</div>
		{:else}
			<div>Waiting for everyone to submit a caption.</div>
		{/if}
	</div>
</div>
