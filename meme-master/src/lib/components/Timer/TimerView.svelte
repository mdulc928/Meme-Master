<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import type { Timer } from './Timer.svelte';

	type TimerViewProps = {
		timer: InstanceType<typeof Timer>;
		class?: string;
	};

	let { timer, class: customClasses }: TimerViewProps = $props();

	let days = $derived(Math.floor(timer.time / 86400));

	let hours = $derived(Math.floor((timer.time - days * 86400) / 3600));
	let minutes = $derived(Math.floor((timer.time - hours * 3600) / 60));
	let seconds = $derived(timer.time % 60);
</script>

<div class={twMerge('flex flex-row gap-3 rounded p-3', customClasses)}>
	<!--counter display-->
	<div class="flex flex-row gap-2">
		{#if days > 0}
			<span>{days.toString().length < 2 ? `0${days}` : days}</span>
			<span>:</span>
		{/if}
		{#if hours > 0}
			<span>{hours.toString().length < 2 ? `0${hours}` : hours}</span>
			<span>:</span>
		{/if}
		<span>{minutes.toString().length < 2 ? `0${minutes}` : minutes}</span>
		<span>:</span><span>{seconds.toString().length < 2 ? `0${seconds}` : seconds}</span>
	</div>
	<!--buttons-->
	<div class="flex flex-row items-center gap-2 text-sm">
		{#if timer.status === 'paused' || timer.status === undefined}
			<button
				class="flex flex-row items-center gap-2 rounded bg-blue-500 px-2 py-1 text-white"
				onclick={() => {
					timer.start();
					console.log('start');
				}}
			>
				<i class="fas fa-play"></i>
				Start</button
			>
		{:else}
			<button
				class="flex flex-row items-center gap-2 rounded bg-blue-500 px-2 py-1 text-white"
				onclick={() => {
					timer.pause();
					console.log('pause');
				}}
			>
				<i class="fas fa-pause"></i>
				Pause</button
			>
		{/if}
		<button
			class="flex flex-row items-center gap-2 rounded bg-red-500 px-2 py-1 text-white"
			onclick={() => {
				timer.reset();
				console.log('reset');
			}}
		>
			<i class="fas fa-sync"></i>
			Reset</button
		>
	</div>
</div>
