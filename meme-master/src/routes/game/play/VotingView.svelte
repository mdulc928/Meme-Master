<script lang="ts">
	import type { User } from '@firebase/auth';
	import {
		addSubmittedCaption,
		getCaptionCard,
		getGame,
		getSubmittedCaptions,
		getUserSubmission
	} from '../game.client.svelte';
	import { getSubmissions } from '../submissions.client.svelte';
	import type { Submission } from '$lib/Game.svelte';
	import { JUGDE_POINTS, MAX_PLAYER_POINTS, MIN_PLAYER_POINTS } from '../utils';
	import type { Snippet } from 'svelte';
	import type { SvelteMap } from 'svelte/reactivity';
	import type { MemeCaption } from '$lib/components/Caption/Assets.svelte';

	let {
		user,
		votingView
	}: {
		user: User;
		votingView: Snippet<
			[
				{
					totalPoints: number;
					pointsUsed: number;
					submissions: Submission[] | undefined;
					submittedCaptions: SvelteMap<string, MemeCaption> | undefined;
					userSubmission: Submission | undefined;
				}
			]
		>;
	} = $props();

	let game = $derived(getGame());
	let participants = $derived(game?.participants);
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

<!--portaling, as I learned from Zac the other day.-->

{@render votingView({
	totalPoints: totalPoints ?? 0,
	pointsUsed: calculateTotalUsed(),
	submissions,
	submittedCaptions,
	userSubmission
})}
