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

	let { user }: { user: User } = $props();
	let game = $derived(getGame());
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

	$effect(() => {
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
</script>

<!--judges only see this the entire round-->
<!--also the whole card is not fectched since we don't want to leak the card.-->
<div class="flex grow flex-col items-center gap-3 py-3">
	<div>
		<span
			class={clsx(isJudge ? 'bg-red-300 font-extrabold' : 'bg-amber-300', 'rounded-lg px-2 py-1')}
		>
			{isJudge ? 'Judge' : 'Jury'}
		</span>
		<span>
			Points Remaining
			<!--This will be calculated by the submissions the user has voted for.-->
		</span>
	</div>
	<div class="lg:max-w-1/3 flex w-full flex-col gap-3 overflow-y-auto">
		<!--for each submission,then show the caption submitted.-->
		{#each submissions ?? [] as submission, i (i)}
			<button
				class="flex w-full flex-col gap-2 rounded-lg bg-blue-200 p-2"
				onclick={async () => {
					if (gameId && user) {
						await submitVote({ gameId, user, points: 100, captionId: submission.caption });
					}
				}}
			>
				<div
					class={clsx('w-full text-left', !submittedCaptions?.has(submission.caption) && 'blur-md')}
				>
					{submittedCaptions?.get(submission.caption)?.text ?? submission.caption}
				</div>
				<div class="flex w-full justify-center">
					<span class="w-full max-w-[10em] rounded-lg bg-purple-300 px-2 py-1 text-center">
						{submission.points.reduce((all, curr) => {
							return all + curr.amount;
						}, 0)}
					</span>
				</div>
			</button>
		{/each}
	</div>
</div>
