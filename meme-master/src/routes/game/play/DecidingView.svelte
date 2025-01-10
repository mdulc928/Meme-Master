<script lang="ts">
	import type { User } from '@firebase/auth';
	import Button from '../../Button.svelte';
	import {
		fetchRoundImage,
		getUserCards,
		getGame,
		getRoundImage,
		setRoundImage,
		fetchUserCards,
		setUserCards
	} from '../game.client.svelte';
	import { text } from '@sveltejs/kit';

	let { user }: { user: User } = $props();
	let game = $derived(getGame());
	let image = $derived(getRoundImage());
	let round = $derived(game?.round);
	let gameId = $derived(game?.uid);
	let cards = $derived(getUserCards());

	$effect.pre(() => {
		if (round !== undefined && gameId !== undefined) {
			fetchRoundImage({ user, gameId }).then((memeImage) => {
				setRoundImage(memeImage);
			});
		}
	});

	$effect.pre(() => {
		if (gameId && round !== undefined) {
			fetchUserCards({ user, gameId }).then((captions) => {
				setUserCards(captions);
			});
		}
	});
</script>

<div class="flex flex-col">
	<!--image takes at least half the screen-->
	<div>
		<!--I can use enhanced here I believe-->
		<img src={image?.url} alt="the meme" />
	</div>
	<div class="flex">
		<div class="flex flex-row">
			<Button><i class="fas fa-angle-left"></i></Button>
			<span>{cards?.at(0)?.text}</span>
			<Button><i class="fas fa-angle-left"></i></Button>
		</div>
		<div>
			<Button><i class="fas arrow-up"></i>Submit</Button>
			<!--<Button>Discard</Button>-->
		</div>
	</div>
</div>
