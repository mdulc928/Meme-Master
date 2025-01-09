<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { clsx } from 'clsx';

	let {
		value = $bindable(),
		containerClass,
		...props
	}: HTMLInputAttributes & { containerClass?: string } = $props();
</script>

<div class={twMerge('flex w-full rounded focus-within:ring', clsx(containerClass))}>
	<input
		{...props}
		bind:value
		class={twMerge('grow border-none outline-none ring-0', clsx(props?.class))}
	/>
</div>
