<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-lvh flex-col text-[16pt] leading-relaxed">
	{@render children()}
</div>
