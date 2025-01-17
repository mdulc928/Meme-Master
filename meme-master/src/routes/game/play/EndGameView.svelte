<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/utils/auth.client.svelte';
	import Button from '../../Button.svelte';
	import { getGame } from '../game.client.svelte';

	let user = $derived(getUser());
	let game = $derived(getGame());
	let sortedParticipants = $derived(game?.participants?.toSorted((a, b) => b.points - a.points));
</script>

<div class="flex grow flex-col items-center justify-center">
	<div class="mb-10 text-5xl font-black">Game Over</div>
	<div>
		{#if sortedParticipants?.[0].user === user?.uid && user?.uid !== undefined}
			<div>
				<span class="rounded bg-yellow-400 p-2 font-bold">You</span> are the
				<span class="font-cursive rounded bg-black p-2 text-yellow-400 underline underline-offset-4"
					>Meme Master</span
				>
			</div>
		{:else}
			<div>
				<span class="rounded bg-yellow-400 p-2 font-bold">{sortedParticipants?.[0].nickname}</span>
				is the
				<span class="font-cursive rounded bg-black p-2 text-yellow-400 underline underline-offset-4"
					>Meme Master</span
				>
			</div>
		{/if}
	</div>
	<Button
		onclick={() => {
			goto('/');
		}}
		class="mt-10"
	>
		Play Again
	</Button>
</div>
