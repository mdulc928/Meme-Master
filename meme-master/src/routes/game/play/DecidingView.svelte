<script lang="ts">
	import type { User } from '@firebase/auth';
	import Button from '../../Button.svelte';
	import {
		getUserCurrentCards,
		getGame,
		setUserCurrentCards,
		submitCaption,
		discardCaption,
		getCaptionCard,
		setNewCard,
		getUserSubmission,
		getNewCard,
		addSubmittedCaption
	} from '../game.client.svelte';
	import Caption from '../Caption.svelte';
	import { onMount } from 'svelte';

	let { user, currentIndex = $bindable() }: { user: User; currentIndex: number } = $props();
	let game = $derived(getGame());
	let gameId = $derived(game?.uid);
	let cards = $derived(getUserCurrentCards());

	let discarding = $state(false);
	let statusMessage = $state<string | undefined>();
	let userSubmission = $derived(getUserSubmission());
	let caption = $derived(cards?.at(currentIndex));
	let newCard = $derived(getNewCard());

	onMount(() => {
		if (newCard !== undefined && userSubmission === undefined) {
			setTimeout(() => {
				setNewCard(undefined);
			}, 5000);
		}
	});
</script>

<div class="flex grow flex-col items-center">
	<!--image takes at most half the screen-->
	{#if caption}
		<Caption class="grow" {caption} position={currentIndex + 1} totalCaptions={cards?.length} />
	{/if}

	<div class="flex h-10 w-full items-center justify-center text-center text-sm text-gray-700">
		{statusMessage}
	</div>
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
			<Button
				class="bg-red-500"
				onclick={() => {
					if (discarding && gameId && caption && cards) {
						const messages = {
							discarding: 'Discarding...',
							gettingNewCard: 'Getting new card...'
						};

						statusMessage = messages.discarding;
						setTimeout(() => {
							if (statusMessage === messages.discarding) {
								statusMessage = undefined;
							}
						}, 5000);

						const cardIndex = currentIndex;
						discardCaption({ gameId, captionId: caption.uid, user })
							.then(async (newCaptionId) => {
								statusMessage = messages.gettingNewCard;
								//todo abstract this pattern.
								setTimeout(() => {
									if (statusMessage === messages.gettingNewCard) {
										statusMessage = undefined;
									}
								}, 5000);
								const newMemeCaption = await getCaptionCard({ captionId: newCaptionId });

								if (statusMessage === messages.gettingNewCard) {
									statusMessage = undefined;
								}

								const newCards = [...cards];
								newCards[cardIndex] = newMemeCaption;
								setUserCurrentCards(newCards);

								setNewCard(newCaptionId);
								setTimeout(() => {
									setNewCard(undefined);
								}, 5000);

								discarding = false;
							})
							.finally(() => {
								discarding = false;
							});
					} else {
						discarding = true;
						const message = 'Press "Discard" again.';
						statusMessage = message;
						setTimeout(() => {
							// this would mean that we haven't discarded.
							if (statusMessage === message) {
								statusMessage = undefined;
								discarding = false;
							}
						}, 5000);
					}
				}}
			>
				<i class="fas fa-trash pr-2"></i>Discard</Button
			>
		</div>
		<div>
			<Button
				class="disabled:cursor-not-allowed disabled:bg-opacity-50 disabled:text-gray-500"
				onclick={async () => {
					const caption = cards?.at(currentIndex);
					const index = currentIndex;
					if (caption && user && gameId) {
						let messages = {
							submitting: 'Submitting...',
							submitted: 'Submitted!',
							gettingNewCard: 'Getting new card...'
						};
						statusMessage = messages.submitting;
						setTimeout(() => {
							if (statusMessage === messages.submitting) {
								statusMessage = undefined;
							}
						}, 5000);

						const { nextCardId } = await submitCaption({
							gameId,
							user,
							captionId: caption.uid
						});
						statusMessage = messages.gettingNewCard;
						setTimeout(() => {
							if (statusMessage === messages.gettingNewCard) {
								statusMessage = undefined;
							}
						}, 5000);
						addSubmittedCaption(caption);

						const newMemeCaption = await getCaptionCard({ captionId: nextCardId });
						const newCards = [...(cards ?? [])];
						newCards[index] = newMemeCaption;
						setUserCurrentCards(newCards);

						setNewCard(nextCardId);
					}
				}}
				disabled={userSubmission !== undefined}><i class="fas arrow-up"></i>Submit</Button
			>
		</div>
	</div>
</div>
