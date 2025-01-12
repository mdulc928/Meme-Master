<script lang="ts">
	import type { MemeCaption } from '$lib/components/Caption/Assets.svelte';
	import clsx from 'clsx';
	import { twMerge } from 'tailwind-merge';

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
</script>

<div class={twMerge(clsx(customClass))}>
	<span class="text-sm font-semibold text-gray-700"
		>Caption
		{#if position !== undefined && totalCaptions !== undefined}
			({position}/{totalCaptions})
		{/if}
	</span>
	<div>{caption.text}</div>
</div>
