<script lang="ts">
	import {
		handleCaptionUpload,
		handleImageUpload,
		type MemeCaption,
		type MemeImage
	} from '$lib/components/Caption/Assets.svelte.js';
	import { getUser, signIn } from '$lib/utils/auth.client.svelte';
	import { onMount } from 'svelte';
	import Button from '../Button.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import Input from '../Input.svelte';

	let captionFiles: FileList | undefined = $state();
	let imageFiles: FileList | undefined = $state();
	let attributions: Map<string, { source: string; display: string }> = $state(new Map());
	let imagesUploaded: Map<string, MemeImage> | undefined = $state();
	$effect(() => {
		console.log('attrbutes', attributions);
	});

	let user = $derived(getUser());
	onMount(() => {
		if (!user && auth) {
			signIn(auth);
		}
	});
</script>

{#snippet imageUpload({ image }: { image: File })}
	{@const attribute = attributions.get(image.name)}
	{@const uploadResult = imagesUploaded?.get(image.name)}
	<div class="flex flex-col gap-2 rounded-lg bg-purple-200 p-2">
		{image.name}
		<div>
			<span>Source Display</span>
			<Input
				type="text"
				value={attribute?.display ?? ''}
				oninput={(e) => {
					const value = e.currentTarget.value;
					let attribution = attribute;
					if (!attribution) {
						attribution = { source: '', display: '' };
					}
					attribution.display = value;
					attributions.set(image.name, attribution);
					console.log('setting on change');
				}}
			/>
		</div>
		<div>
			<span>Source Link</span>
			<Input type="text" />
		</div>
		{#if uploadResult}
			<div class="relative inset-0 flex w-full rounded">
				<img src={uploadResult.url} alt="a meme" class="absolute left-0 top-0" />
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex h-full grow flex-col overflow-auto p-4">
	<div class="flex flex-col gap-2">
		<!--for uploading captions-->
		<span>Captions</span>
		<input bind:files={captionFiles} type="file" multiple accept=".csv,text/csv" />
		<Button
			disabled={!(captionFiles && captionFiles.length > 0)}
			class="disabled:cursor-none disabled:bg-opacity-50 disabled:text-gray-500"
			onclick={() => {
				if (captionFiles && captionFiles.length > 0) {
					handleCaptionUpload({ captionFiles });
				}
			}}>Upload</Button
		>
	</div>
	<div class="flex flex-col gap-2">
		<!-- for uploading images -->
		<span>Images</span>
		<input bind:files={imageFiles} type="file" multiple accept="image/*" />
		<Button
			disabled={!(imageFiles && imageFiles.length > 0)}
			class="disabled:cursor-none disabled:bg-opacity-50 disabled:text-gray-500"
			onclick={async () => {
				if (!user) {
					if (auth) await signIn(auth);
					else {
						console.error('auth is undefined');
						return;
					}
				}

				console.log('uploading now');
				if (imageFiles && imageFiles.length > 0) {
					imagesUploaded = await handleImageUpload({ imageFiles, attributions });
				}
			}}>Upload</Button
		>
		<div class="flex grow flex-col gap-2 overflow-auto">
			{#each imageFiles ?? [] as image, i (i)}
				{@render imageUpload({ image })}
			{/each}
		</div>
	</div>
</div>
