import { browser } from '$app/environment';
import themeTrack from '$lib/assets/main.mp3';
import { onMount, onDestroy } from 'svelte';

let myTrack: { audio?: HTMLAudioElement } = $state({});
const soundOnKey = 'sound-on';
let isSoundOn = $state(browser ? JSON.parse(localStorage.getItem(soundOnKey) ?? 'true') : false);

export function getIsMainTrackPlaying() {
	return isSoundOn && myTrack?.audio?.played;
}

export function soundHasntPlayed() {
	return localStorage.getItem(soundOnKey) === null;
}

export function playMainTrack() {
	myTrack?.audio?.play();
	localStorage.setItem(soundOnKey, 'true');
	isSoundOn = true;
}

export function pauseMainTrack() {
	myTrack?.audio?.pause();
	localStorage.setItem(soundOnKey, 'false');
	isSoundOn = false;
}

export function setupMainTrack() {
	onMount(() => {
		const newAudio = new Audio(themeTrack);
		newAudio.loop = true;
		newAudio.volume = 0.1;
		if (isSoundOn) {
			newAudio.play();
		}

		myTrack = { audio: newAudio };
	});

	onDestroy(() => {
		myTrack?.audio?.pause();
	});
}
