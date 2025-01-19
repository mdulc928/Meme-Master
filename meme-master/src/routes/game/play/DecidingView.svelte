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
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';

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

	const showInstructionsDecidingKey = 'show-instructions-deciding';
	const instructionsIndexDecidingKey = 'instructions-index-deciding';
	let showInstructionsDeciding = $state<boolean>(
		browser ? JSON.parse(localStorage.getItem(showInstructionsDecidingKey) ?? 'true') : false
	);
	let instructionsIndex = $state<number>(
		browser ? parseInt(localStorage.getItem(instructionsIndexDecidingKey) ?? '0') : 0
	);

	const instructions: string[] = [
		'All the other players see this image.',
		'Only you see these 10 caption cards (👆👀).',
		'Submit a caption you think the judge will like.',
		'Flip through your cards using the arrows.',
		"Replace a card if you don't like it.",
		'You can only submit a caption once.'
	];
	$effect(() => {
		if (!showInstructionsDeciding && !statusMessage) {
			return;
		}

		const instructionInterval = setInterval(() => {
			if (showInstructionsDeciding && !statusMessage) {
				instructionsIndex = (instructionsIndex + 1) % instructions.length;
				localStorage.setItem(instructionsIndexDecidingKey, instructionsIndex.toString());
			}
		}, 6000);

		return () => {
			clearInterval(instructionInterval);
		};
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
	<div class="relative flex flex-row items-center gap-2">
		{#if showInstructionsDeciding && !statusMessage}
			{#key instructionsIndex}
				<div
					in:fly={{ x: -10, duration: 2000, delay: 1000 }}
					out:fade={{ duration: 500, delay: 0 }}
					class="absolute top-0 flex w-full -translate-y-full justify-between rounded-full border px-2 text-center shadow-lg drop-shadow-lg"
				>
					<div>
						<i class="fas fa-lightbulb my-2 text-yellow-500 drop-shadow-md"></i>
						<span class="text-md text-pretty font-light">{instructions[instructionsIndex]}</span>
					</div>
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						onclick={() => {
							instructionsIndex = (instructionsIndex + 1) % instructions.length;
							localStorage.setItem(instructionsIndexDecidingKey, instructionsIndex.toString());
							showInstructionsDeciding = false;
							localStorage.setItem(showInstructionsDecidingKey, 'false');
						}}><i class="fas fa-xmark"></i></button
					>
				</div>
			{/key}
		{/if}

		<div class="flex flex-row items-center gap-2 py-3">
			<!--Previous card button-->
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
			<!--Next card button-->
			<Button
				class="bg-black text-white"
				onclick={() => {
					if (cards) {
						const length = cards.length;
						currentIndex = (currentIndex + 1) % length;
					}
				}}><i class="fas fa-angle-right"></i></Button
			>
			<!--Discard Button-->
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
						const message = 'Press "Replace" again.';
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
				<i class="fas fa-retweet pr-2"></i>Replace</Button
			>
		</div>
		<div>
			<!--Submit button-->
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
