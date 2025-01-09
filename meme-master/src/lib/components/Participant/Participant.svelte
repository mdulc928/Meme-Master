<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import type { Participant } from './Participant.svelte.js';
	import { clsx } from 'clsx';

	let {
		participant,
		rank,
		class: customClasses,
		mode
	}: {
		participant: Participant;
		rank?: number;
		mode?: 'lobby';
		class?: string;
	} = $props();
</script>

<!--don't forget to change the backgroudn-->
<div
	class={twMerge(
		'relative flex flex-col items-center justify-center gap-2 rounded bg-slate-200',
		clsx(customClasses)
	)}
>
	<span class="font-semibold">{participant.nickname.toUpperCase()}</span>
	{#if rank !== undefined}
		<span class="right-0 top-0">#{rank}</span>
	{/if}
	<span class="font-serif text-2xl">{participant.points}</span>
</div>
