<script lang="ts">
	import type { User } from '@firebase/auth';
	import Button from '../../Button.svelte';
	import { fetchRoundImage, getGame, getRoundImage, setRoundImage } from '../game.client.svelte';

	let { user }: { user: User } = $props();
	let game = $derived(getGame());
	let image = $derived(getRoundImage());
	let round = $derived(game?.round);
	let gameId = $derived(game?.uid);

	$effect.pre(() => {
		if (round !== undefined && gameId !== undefined) {
			fetchRoundImage({ user, gameId }).then((memeImage) => {
        setRoundImage(memeImage);
      })
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
			<span>caption text</span>
			<Button><i class="fas fa-angle-left"></i></Button>
		</div>
		<div>
			<Button><i class="fas arrow-up"></i>Submit</Button>
			<!--<Button>Discard</Button>-->
		</div>
	</div>
</div>
