<script lang="ts">
	import '../app.css';
	import mainTrack from '$lib/assets/main.mp3';
	import { onDestroy, onMount } from 'svelte';
	import { clsx } from 'clsx';
	import { browser } from '$app/environment';

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

	let showHelp = $state(true);
</script>

{#snippet helpContent()}
	<div class="max-w-[30em] overflow-auto px-3">
		<div>
			<h1 class="py-2 text-3xl">TLDR; (summary)</h1>
			<div>
				<ol>
					<li>Players get 8 cards to start.</li>
					<!--The rest of the summary-->
				</ol>
				Have fun!
			</div>
		</div>
		<h1 class="py-2 pb-3 text-3xl">Detailed Instructions</h1>
		<hr />
		<div class="py-2">
			<h2 class="text-2xl">Objective</h2>
			<div class="py-1 pl-2">
				<p class="leading-snug">
					The goal of Meme Master is to be the funniest player and win meme cards. The first player
					to collect 8 meme cards or have the most points when time runs out becomes the Meme
					Master!
				</p>
			</div>
		</div>
		<div class="py-2">
			<h2 class="text-2xl">How to Play</h2>
			<div class="pl-2">
				<ol>
					<li>What You Need</li>
					<li>The Players & The Judge</li>
				</ol>
			</div>
			<h2 class="text-2xl">The Game Round</h2>
			<div>
				<ol>
					<li>Round Setup</li>
					<li>Playing the Round</li>
					<li>The Judge's Job</li>
				</ol>
			</div>
			<h2 class="text-2xl">Voting on the Funniest Meme</h2>
			<div>
				<ol>
					<li>Who Wins the Round?</li>
					<li>Bonus Points</li>
				</ol>
			</div>
		</div>
	</div>
{/snippet}

<div class="grid min-h-lvh grid-cols-1 grid-rows-1">
	<div
		class="relative col-start-1 col-end-1 row-start-1 row-end-1 flex min-h-lvh flex-col text-[16pt] leading-relaxed"
	>
		<div class="sticky top-0 flex h-14 w-full gap-2 px-3 lg:justify-around">
			<div class="flex w-full max-w-[36em] items-center gap-2 [&_button]:px-1 lg:[&_button]:px-3">
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
			</div>
		</div>
		{#if showHelp}
			{@render helpContent()}
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
