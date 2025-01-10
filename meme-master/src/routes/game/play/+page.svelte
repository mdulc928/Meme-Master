<script lang="ts">
	import Button from '../../Button.svelte';

	let view: 'decide' | 'vote' = $state('decide');
	// this is rotating index. We allow them to keep pressing 1 button,
	// and when we reach the end of list of cards we just mod that.
	let currentCaptionIndex: number = $state(0);
</script>

{#snippet decidingView()}
	<div class="flex flex-col">
		<!--image takes at least half the screen-->
		<div>
			<!--I can use enhanced here I belive-->
			<img src="https://hello.png" alt="the meme" />
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
{/snippet}

{#snippet votingView()}
	<!--judges only see this the entire round-->
	<!--also the whole card is not fectched since we don't want to leak the card.-->
	<div>
		<div>Points Remaining: #### <span class="if judge red if player green">Role</span></div>
		<div class="flex grow gap-3 overflow-y-auto">
			<!--for each submission,then show the caption submitted.-->
		</div>
	</div>
{/snippet}

{#if view === 'decide'}
	{@render decidingView()}
{:else}
	{@render votingView()}
{/if}
