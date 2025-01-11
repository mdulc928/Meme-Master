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
</script>

<div class="relative flex min-h-lvh flex-col text-[16pt] leading-relaxed">
	<div class="sticky top-0 flex h-14 w-full gap-2 px-3 lg:justify-around">
		<div class="flex w-full max-w-[36em] items-center gap-2 [&_button]:px-1 lg:[&_button]:px-3">
			<button class="flex items-center gap-2"><i class="far fa-circle-question"></i>Help</button>
			<button
				class="flex items-center gap-2"
				onclick={() => {
					console.log('playing');
					if (myTrack?.audio?.paused) {
						myTrack?.audio?.play();
						shouldPlay = true;
						localStorage.setItem(soundOnKey, 'true');
					} else {
						myTrack?.audio?.pause();
						shouldPlay = false;
						localStorage.setItem(soundOnKey, 'false');
					}
				}}
				><i class={clsx(shouldPlay && 'fas fa-volume-high', !shouldPlay && 'fas fa-volume-xmark')}
				></i>Sound
			</button>
		</div>
	</div>
	{@render children()}
</div>
