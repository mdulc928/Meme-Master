<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { clsx } from 'clsx';

	let {
		value = $bindable(),
		containerClass,
		...props
	}: HTMLInputAttributes & { containerClass?: string } = $props();

	let inputEl: HTMLInputElement;
	export function focus() {
		inputEl?.focus();
	}
</script>

<div
	class={twMerge(
		'flex items-center justify-center overflow-hidden rounded focus-within:ring',
		clsx(containerClass)
	)}
>
	<input
		bind:this={inputEl}
		{...props}
		bind:value
		class={twMerge('flex grow border-none bg-transparent outline-none ring-0', clsx(props?.class))}
	/>
</div>
