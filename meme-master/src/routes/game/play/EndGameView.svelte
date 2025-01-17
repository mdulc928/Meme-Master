<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/utils/auth.client.svelte';
	import Button from '../../Button.svelte';
	import { getGame } from '../game.client.svelte';

	let user = $derived(getUser());
	let game = $derived(getGame());
	let sortedParticipants = $derived(game?.participants?.toSorted((a, b) => b.points - a.points));
	let participant = $derived(
		sortedParticipants?.find((participant) => participant.user === user?.uid)
	);
	let participantRank = $derived(
		sortedParticipants?.findIndex((participant) => participant.user === user?.uid)
	);
</script>

<div class="flex grow flex-col items-center justify-center">
	<div class="mb-10 text-5xl font-black">Game Over</div>
	<div>
		{#if sortedParticipants?.[0].user === user?.uid && user?.uid !== undefined}
			<div class="text-center">
				<span class="rounded bg-yellow-400 p-2 font-bold">You</span> are the
				<span class="font-cursive rounded bg-black p-2 text-yellow-400 underline underline-offset-4"
					>Meme Master</span
				>
			</div>
		{:else}
			<div class="text-center">
				<span class="rounded bg-yellow-400 p-2 font-bold">{sortedParticipants?.[0].nickname}</span>
				is the
				<span class="font-cursive rounded bg-black p-2 text-yellow-400 underline underline-offset-4"
					>Meme Master</span
				>
			</div>
		{/if}
		{#if participantRank !== undefined}
			<div class="mt-8 border-t-2 pt-4 text-center">
				You ({participant?.nickname}) are ranked
				<span class="font-bold">{participantRank + 1}</span>
				out of
				<span class="font-bold">{sortedParticipants?.length}</span>
				with a total of <span class="font-bold">{participant?.points}</span> points.
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
