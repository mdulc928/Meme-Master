<script lang="ts">
	import type { User } from '@firebase/auth';
	import {
		fetchRoundImage,
		getGame,
		getRoundImage,
		setRoundImage,
		submitVote
	} from '../game.client.svelte';
	import { createSubmissionsListener, getSubmissions } from '../submissions.client.svelte';
	import Button from '../../Button.svelte';

	let { user }: { user: User } = $props();
	let image = $derived(getRoundImage());
	let game = $derived(getGame());
	let gameId = $derived(game?.uid);
	let round = $derived(game?.round);

	let isJudge = $derived.by(() => {
		return !!game?.participants?.some(
			(participant) => participant.user === user?.uid && participant.role === 'judge'
		);
	});

	$effect.pre(() => {
		if (round !== undefined && gameId !== undefined) {
			fetchRoundImage({ user, gameId }).then((memeImage) => {
				setRoundImage(memeImage);
			});
		}
	});

	let submissions = $derived(getSubmissions());
	$effect.pre(() => {
		if (gameId && round !== undefined) {
			return createSubmissionsListener({ gameId, gameRound: round });
		}
	});

	// it's be cool to add that one day user can spectate and so they see what everyone has.
</script>

<!--judges only see this the entire round-->
<!--also the whole card is not fectched since we don't want to leak the card.-->
<div>
	<div>
		<!--todo I can use enhanced here I believe-->
		<img src={image?.url} alt="the meme" />
	</div>
	<div>Points Remaining: #### <span class="if judge red if player green">Role</span></div>
	<div class="flex grow gap-3 overflow-y-auto">
		<!--for each submission,then show the caption submitted.-->
		{#each submissions ?? [] as submission, i (i)}
			<Button
				onclick={async () => {
					if (gameId && user) {
						await submitVote({ gameId, user, points: 100, captionId: submission.caption });
					}
				}}
				>{submission.points.reduce((all, curr) => {
					return all + curr.amount;
				}, 0)}</Button
			>
		{/each}
	</div>
</div>
