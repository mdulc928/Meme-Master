<script lang="ts">
	import { getUser } from '$lib/utils/auth.client.svelte';
	import { getGame } from '../game.client.svelte';
	import DecidingView from './DecidingView.svelte';
	import VotingView from './VotingView.svelte';
	import EndGameView from './EndGameView.svelte';
	console.log('got stuff');
	let user = $derived(getUser());
	let game = $derived(getGame());

	let view = $derived(game?.status);
	let gameId = $derived(game?.uid);

	console.log('stuff', view, gameId, user, game);

	// this is rotating index. We allow them to keep pressing 1 button,
	// and when we reach the end of list of cards we just mod that.
	let currentCaptionIndex: number = $state(0);
	$effect(() => console.log('hello there'));
</script>

{#if user}
	{#if view === 'deciding'}
		<DecidingView {user} />
	{:else if view === 'voting'}
		<VotingView {user} />
	{:else if view === 'ended'}
		<EndGameView />
	{/if}
{:else}
	<div>Bad Page</div>
{/if}
