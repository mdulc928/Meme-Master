<script lang="ts">
	import { clsx } from 'clsx';
	let time = $state(1);
	let interval = $state<number | undefined>();
</script>

<div class="flex flex-col items-center justify-center gap-3 p-2">
	<h1 class="font-serif font-bold">Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
		Just checking to see is my hmr is working
	</p>

	<button
		class={clsx(
			'flex rounded-lg px-4 py-2 font-semibold text-white',
			interval === undefined ? 'bg-blue-500' : 'bg-red-400'
		)}
		onclick={() => {
			if (interval) {
				window.clearInterval(interval);
				interval = undefined;
			} else {
				interval = window.setInterval(() => {
					time += 1;
				}, 1000);
			}
		}}
	>
		{interval !== undefined ? 'Start' : 'Stop'}
	</button>
	{time} passed
</div>
