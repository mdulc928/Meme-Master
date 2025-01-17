<script lang="ts">
	import '../app.css';
	import mainTrack from '$lib/assets/main.mp3';
	import { onDestroy, onMount } from 'svelte';
	import { clsx } from 'clsx';
	import { browser } from '$app/environment';
	import { createUserTotalPointsListener, getUserTotalPoints } from './game/game.client.svelte';
	import { getUser } from '$lib/utils/auth.client.svelte';

	let { children } = $props();
	let myTrack: { audio?: HTMLAudioElement } = $state({});
	const soundOnKey = 'sound-on';
	let shouldPlay = $state(browser ? JSON.parse(localStorage.getItem(soundOnKey) ?? 'true') : false);

	onMount(() => {
		const newAudio = new Audio(mainTrack);
		newAudio.loop = true;
		newAudio.volume = 0.1;
		if (shouldPlay) {
			newAudio.play();
		}

		myTrack = { audio: newAudio };
	});

	onDestroy(() => {
		myTrack?.audio?.pause();
	});

	let user = $derived(getUser());
	let userTotalPoints = $derived(getUserTotalPoints());

	$effect(() => {
		if (user) {
			return createUserTotalPointsListener({ user });
		}
	});

	// in the future we could probably save this in local storage
	let showHelp = $state(false);
</script>

{#snippet comingSoon()}
	<span class="text-sm text-gray-500">(Coming soon...)</span>
{/snippet}

{#snippet helpContent()}
	<div
		class="max-w-[30em] overflow-auto px-3 [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:list-disc"
	>
		<!-- Summary (TLDR) -->
		<div>
			<h1 class="py-2 text-3xl font-bold">TL;DR (Summary)</h1>
			<hr />
			<div class="pt-2">
				<ol class="list-inside list-decimal space-y-1 pb-4 leading-normal">
					<li>Players get 10 cards to start.</li>
					<li>{@render comingSoon()}A Judge picks a meme card for everyone to answer.</li>
					<li>
						{@render comingSoon()} Players submit funny responses (or create their own if they want).
					</li>
					<li>The Judge picks the funniest response and gives the meme card to the winner.</li>
					<li>
						Everyone votes for the funniest answer and can give bonus points to their favorites.
					</li>
					<!-- Updated bullet to mention time running out condition -->
					<li>
						The first player to collect 8 meme cards
						<strong>(or have the most points when time runs out)</strong> becomes the Meme Master!
					</li>
				</ol>
				<span class="py-2">Have fun! 🎉 🎉 🎉</span>
			</div>
		</div>

		<!-- Detailed Instructions -->
		<h1 class="mt-6 py-2 pb-3 text-3xl font-bold">Detailed Instructions</h1>
		<hr class="mb-4" />

		<!-- Objective -->
		<div class="py-2">
			<h2 class="text-2xl font-semibold">Objective</h2>
			<div class="py-1 pl-2">
				<p class="leading-snug">
					The goal of Meme Master is to be the funniest player and win meme cards. The first player
					to collect 8 meme cards
					<strong>(or {@render comingSoon()} have the most points when time runs out)</strong> becomes
					the Meme Master!
				</p>
			</div>
		</div>

		<!-- How to Play -->
		<div class="py-2">
			<h2 class="mb-2 text-2xl font-semibold">How to Play</h2>
			<div class="pl-2">
				<ol class="list-inside list-decimal space-y-4">
					<li>
						<span class="font-bold">What You Need</span>
						<ul class="mt-1 list-inside list-disc space-y-1 pl-6">
							<li>Everyone plays on their phones (so make sure you have one ready to go).</li>
							<li>You'll need at least 3 players to start the game.</li>
							<li>Fingers 😂 (for tapping the right answers quickly!)</li>
						</ul>
					</li>

					<li>
						<span class="font-bold">The Players &amp; The Judge</span>
						<div class="mt-1 pl-4">
							<p><strong>Players:</strong> You’ll submit funny answers to meme cards.</p>
							<p>
								<strong>Judge:</strong> Every round, one person is the judge. The judge picks which meme
								answer they like best!
							</p>
						</div>
					</li>
				</ol>
			</div>

			<!-- The Game Round -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">The Game Round</h2>
			<div class="pl-2">
				<ol class="list-inside list-decimal space-y-4">
					<li>
						<span class="font-bold">Round Setup</span><br />
						<span class="mt-1 block pl-4">
							Each player starts with 10 meme cards. These cards have funny words or phrases on them
							(like “Unicorn in space!” or “When you get ice cream at 3 AM”).<br />
							The Judge picks a meme card (a funny prompt) to share with everyone.
						</span>
					</li>

					<li>
						<span class="font-bold">Playing the Round</span><br />
						<span class="mt-1 block pl-4">
							Players pick one card from their hand (or make a funny response if they don’t like
							their cards) and send it in. If a player doesn’t like the cards they have, they can
							create a custom response! They’ll lose one card, but get a chance to make something
							funnier.
						</span>
					</li>

					<li>
						<span class="font-bold">The Judge's Job</span><br />
						<span class="mt-1 block pl-4">
							The Judge will not see anyone’s answers until all players have sent their responses.<br
							/>
							After everyone submits, the Judge reads them and decides which answer is the funniest.
						</span>
					</li>
				</ol>
			</div>

			<!-- Voting on the Funniest Meme -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">Voting on the Funniest Meme</h2>
			<div class="pl-2">
				<ol class="list-inside list-decimal space-y-4">
					<li>
						<span class="font-bold">Who Wins the Round?</span><br />
						<span class="mt-1 block pl-4">
							After the Judge reads all the answers, everyone (including the Judge) votes on which
							response is the funniest.
						</span>
					</li>
					<li>
						<span class="font-bold">Bonus Points</span><br />
						<span class="mt-1 block pl-4">
							Players can also give bonus points to answers they like most. But be careful — don’t
							give all your points to the same answer! Bonus points help the funniest answers shine.
						</span>
					</li>
					<li>
						<span class="font-bold">Revealing the Winner</span><br />
						<span class="mt-1 block pl-4">
							After voting, the Judge picks the best answer, and that player wins the meme card. The
							Meme Master (the winner) gets a special badge and keeps their meme card!
						</span>
					</li>
				</ol>
			</div>

			<!-- Winning the Game -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">Winning the Game</h2>
			<div class="pl-2">
				<p class="leading-snug">
					The game keeps going with new rounds, and each time someone wins a round, they get a new
					meme card. The first player to collect 8 meme cards
					<strong>(or have the most points when time runs out)</strong>
					wins and is crowned the Meme Master!
				</p>
			</div>

			<!-- Extra Game Features -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">Extra Game Features</h2>
			<div class="pl-2">
				<ol class="list-inside list-decimal space-y-4">
					<li>
						<span class="font-bold">Time Limits</span><br />
						<span class="mt-1 block pl-4">
							Players get 40 seconds to submit their funny responses.<br />
							The Judge gets 30 seconds to pick the next meme card.
						</span>
					</li>
					<li>
						<span class="font-bold">Pausing the Game</span><br />
						<span class="mt-1 block pl-4">
							You can pause the game whenever you need a break. Just hit the pause button!
						</span>
					</li>
				</ol>
			</div>

			<!-- How to Keep the Game Fair and Fun -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">How to Keep the Game Fair and Fun</h2>
			<div class="pl-2">
				<ul class="list-inside list-disc space-y-2 pl-4">
					<li>
						Everyone takes turns judging: Each round, someone different is the Judge, so everyone
						gets a chance to pick the funniest answers!
					</li>
					<li>
						<span class="font-bold">No take-backs:</span> Once you vote or give bonus points, you can’t
						change your mind. Choose wisely!
					</li>
				</ul>
			</div>

			<!-- Final Summary or Recap -->
			<h2 class="mb-2 mt-6 text-2xl font-semibold">Final Recap</h2>
			<div class="pl-2">
				<ul class="list-inside list-disc space-y-1 pl-4 leading-normal">
					<li>Start with 10 cards.</li>
					<li>Judge picks a meme card to fill in.</li>
					<li>Players pick a card (or create their own) to respond.</li>
					<li>Judge picks the funniest, that player wins a meme card.</li>
					<li>Everyone votes for the funniest answer and gives bonus points.</li>
					<!-- Updated recap to include time-based condition -->
					<li>
						Collect 8 meme cards or finish with the highest points when the timer runs out to become
						the Meme Master!
					</li>
				</ul>
			</div>
		</div>
	</div>
{/snippet}

<div class="grid min-h-lvh grid-cols-1 grid-rows-1">
	<div
		class="relative col-start-1 col-end-1 row-start-1 row-end-1 flex min-h-lvh w-full grow flex-col text-[16pt] leading-relaxed"
	>
		<div
			class="sticky top-0 flex h-14 w-full gap-2 bg-white bg-opacity-50 p-2 px-3 backdrop-blur lg:justify-around"
		>
			<div
				class="relative flex w-full max-w-[36em] items-center gap-2 [&_button]:px-1 lg:[&_button]:px-3"
			>
				<button
					class="flex items-center gap-2"
					onclick={() => {
						showHelp = !showHelp;
					}}
					>{#if showHelp}
						<i class="fas fa-xmark"></i>Close
					{:else}
						<i class="far fa-circle-question"></i>Help
					{/if}
				</button>
				<button
					class="flex items-center gap-2"
					onclick={() => {
						shouldPlay = !shouldPlay;
						if (myTrack?.audio?.paused) {
							myTrack?.audio?.play();
							localStorage.setItem(soundOnKey, 'true');
						} else {
							myTrack?.audio?.pause();
							localStorage.setItem(soundOnKey, 'false');
						}
					}}
					><i class={clsx(shouldPlay && 'fas fa-volume-high', !shouldPlay && 'fas fa-volume-xmark')}
					></i>Sound
				</button>
				<div class="flex-grow"></div>
				<a href="/" class="flex items-center gap-2">
					<i class="fas fa-house"></i>Home
				</a>
				{#if user && userTotalPoints !== undefined && userTotalPoints !== null}
					<!--show the user's points here.-->
					<div
						class="absolute -right-1 top-[90%] rounded-full bg-yellow-300 bg-opacity-50 px-3 font-extrabold text-black lg:static lg:bg-opacity-100 lg:p-2"
					>
						<i class="fas fa-crown"></i>
						{userTotalPoints}
					</div>
				{/if}
			</div>
		</div>
		{#if showHelp}
			{@render helpContent()}
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
