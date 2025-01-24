<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	let {
		instructionsMarkup,
    instructionsLength: totalInstructions,
    instructionIndexKey,
    showInstructionsKey,
    guard,
	}: {
		instructionsMarkup: Snippet<[{ handleCloseInstructions: () => void, instructionsIndex: number, showInstructions: boolean }]>;
		instructionsLength: number;
		instructionIndexKey: string;
		showInstructionsKey: string;
    guard?: boolean;
	} = $props();


	let showInstructions = $state<boolean>(
		browser ? JSON.parse(localStorage.getItem(showInstructionsKey) ?? 'true') : false
	);
	let instructionsIndex = $state<number>(
		browser ? parseInt(localStorage.getItem(instructionIndexKey) ?? '0') : 0
	);

	$effect(() => {
		if (!showInstructions && !guard) {
			return;
		}

		const instructionInterval = setInterval(() => {
			if (showInstructions && !guard) {
				instructionsIndex = (instructionsIndex + 1) % totalInstructions;
				localStorage.setItem(instructionIndexKey, instructionsIndex.toString());
			}
		}, 6000);

		return () => {
			clearInterval(instructionInterval);
		};
	});

	function handleCloseInstructions() {
		instructionsIndex = (instructionsIndex + 1) % totalInstructions;
		localStorage.setItem(instructionIndexKey, instructionsIndex.toString());
		showInstructions = false;
		localStorage.setItem(showInstructionsKey, 'false');
	}
</script>

{@render instructionsMarkup({ handleCloseInstructions, instructionsIndex, showInstructions })}
