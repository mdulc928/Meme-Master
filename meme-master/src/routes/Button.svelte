<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, ...props }: HTMLButtonAttributes = $props();
</script>

<button {...props}>
	{@render children?.()}
</button>
