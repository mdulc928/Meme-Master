<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { clsx } from 'clsx';

	let {
		children,
		size = 'md',
		...props
	}: HTMLButtonAttributes & {
		size?: 'sm' | 'md' | 'lg';
	} = $props();
</script>

<button
	{...props}
	class={twMerge(
		'flex items-center justify-center rounded-lg bg-purple-300 px-4 py-1 font-semibold focus:ring',
		clsx(
			{
				'h-10 text-lg': size === 'sm',
				'h-16 text-xl': size === 'md',
				'h-24 text-2xl': size === 'lg'
			},
			props?.class
		)
	)}
>
	{@render children?.()}
</button>
