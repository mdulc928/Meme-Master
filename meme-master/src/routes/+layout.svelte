<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="relative flex min-h-lvh flex-col text-[16pt] leading-relaxed">
	<div class="sticky top-0 flex h-14 w-full gap-2 px-3 lg:justify-around">
		<div class="flex w-full max-w-[36em] items-center gap-2 [&_button]:px-1 lg:[&_button]:px-3">
			<button class="flex items-center gap-2"><i class="far fa-circle-question"></i>Help</button>
			<button class="flex items-center gap-2"><i class="fas fa-volume-high"></i>Sound</button>
		</div>
	</div>
	{@render children()}
</div>
