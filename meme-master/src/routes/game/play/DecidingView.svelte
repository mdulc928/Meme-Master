<script lang="ts">
	import type { User } from '@firebase/auth';
	import Button from '../../Button.svelte';
	import {
		fetchRoundImage,
		getUserCards,
		getGame,
		getRoundImage,
		setRoundImage,
		fetchUserCards,
		setUserCards,
		submitCaption
	} from '../game.client.svelte';
	import {
		createSubmissionsListener,
		getSubmissions,
		setSubmissions
	} from '../submissions.client.svelte';

	let { user, currentIndex }: { user: User; currentIndex: number } = $props();
	let game = $derived(getGame());
	let image = $derived(getRoundImage());
	let round = $derived(game?.round);
	let gameId = $derived(game?.uid);
	let cards = $derived(getUserCards());

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
	let submitted = $state(false);
	$effect.pre(() => {
		if ((gameId && round !== undefined && !isJudge) || (submitted && gameId)) {
			fetchUserCards({ user, gameId }).then((captions) => {
				setUserCards(captions);
			});
			submitted = false;
		}
	});

	let submissions = $derived(getSubmissions());
	$effect.pre(() => {
		if (isJudge && gameId && round !== undefined) {
			return createSubmissionsListener({ gameId, gameRound: round });
		}
	});
</script>

<div class="flex flex-col">
	<!--image takes at most half the screen-->
	<div>
		<!--todo I can use enhanced here I believe-->
		<img src={image?.url} alt="the meme" />
	</div>
	{#if !isJudge}
		<div class="flex">
			<div class="flex flex-row">
				<Button><i class="fas fa-angle-left"></i></Button>
				<span>{cards?.at(currentIndex)?.text}</span>
				<Button><i class="fas fa-angle-left"></i></Button>
			</div>
			<div>
				<Button
					onclick={async () => {
						const caption = cards?.at(currentIndex);
						if (caption && user && gameId) {
							await submitCaption({
								gameId,
								user,
								captionId: caption.uid
							});

							submitted = true;
						}
					}}><i class="fas arrow-up"></i>Submit</Button
				>
				<!--<Button>Discard</Button>-->
			</div>
		</div>
	{:else}
		<div>
			Submissions
			{#each submissions ?? [] as submission, i (i)}
				<div>{i}</div>
			{/each}
		</div>
	{/if}
</div>
