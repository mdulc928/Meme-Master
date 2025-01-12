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
	import { createSubmissionsListener, getSubmissions } from '../submissions.client.svelte';
	import Caption from '../Caption.svelte';

	let { user, currentIndex = $bindable() }: { user: User; currentIndex: number } = $props();
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

<div class="flex grow flex-col items-center px-3 py-5">
	<!--image takes at most half the screen-->
	<div class="max-h-1/3 max-w-[30em] overflow-hidden rounded-lg">
		<!--todo I can use enhanced here I believe-->
		<img src={image?.url} alt="the meme" />
	</div>
	{#if !isJudge}
		{@const caption = cards?.at(currentIndex)}
		{#if caption}
			<Caption class="grow" {caption} position={currentIndex + 1} totalCaptions={cards?.length} />
		{/if}
		<div class="flex flex-row items-center gap-2">
			<div class="flex flex-row items-center gap-2 py-3">
				<Button
					class="bg-black text-white"
					onclick={() => {
						if (cards) {
							const length = cards.length;
							if (currentIndex === 0) {
								currentIndex = length - 1;
							} else {
								currentIndex -= 1;
							}
						}
					}}><i class="fas fa-angle-left"></i></Button
				>
				<Button
					class="bg-black text-white"
					onclick={() => {
						if (cards) {
							const length = cards.length;
							currentIndex = (currentIndex + 1) % length;
						}
					}}><i class="fas fa-angle-right"></i></Button
				>
				<Button class="bg-red-500">
					<i class="fas fa-trash pr-2"></i>Discard</Button
				>
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
