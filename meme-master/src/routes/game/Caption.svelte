<script lang="ts">
	import type { MemeCaption } from '$lib/components/Caption/Assets.svelte';
	import clsx from 'clsx';
	import { twMerge } from 'tailwind-merge';
	import { getNewCard } from '../../lib/game.client.svelte';
	

	let {
		class: customClass,
		caption,
		points,
		position,
		totalCaptions
	}: {
		class: string;
		caption: MemeCaption;
		points?: number;
		position?: number;
		totalCaptions?: number;
	} = $props();

	let isNew = $derived(getNewCard() === caption.uid);
</script>

<div class={twMerge(clsx(customClass))}>
	<span class="text-sm font-semibold text-gray-700"
		>Caption
		{#if position !== undefined && totalCaptions !== undefined}
			({position}/{totalCaptions})
		{/if}
		{#if isNew}
			<span class="rounded-full bg-amber-300 px-1">New</span>
		{/if}
	</span>
	<div>{caption.text}</div>
</div>
