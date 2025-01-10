<script lang="ts">
	import type { User } from '@firebase/auth';

	let { user }: { user: User } = $props();
	// it's be cool to add that one day user can spectate and so they see what everyone has.
</script>

<!--judges only see this the entire round-->
<!--also the whole card is not fectched since we don't want to leak the card.-->
<div>
	<div>Points Remaining: #### <span class="if judge red if player green">Role</span></div>
	<div class="flex grow gap-3 overflow-y-auto">
		<!--for each submission,then show the caption submitted.-->
	</div>
</div>
