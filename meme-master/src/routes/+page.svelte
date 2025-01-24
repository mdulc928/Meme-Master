<script lang="ts">
	import Button from './Button.svelte';
	import { fetchWithAuth, signIn, getUser } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import Input from './Input.svelte';
	import { goto } from '$app/navigation';
	import clsx from 'clsx';
	import { playMainTrack, soundHasntPlayed } from './audio.svelte';
	import { onMount } from 'svelte';
	import { clearGameState } from '../lib/game.client.svelte';

	let gameId: number | undefined = $state();
	let nickname: string = $state('');
	let gameCode: [string, string, string, string] = $state(['', '', '', '']);

	let user = $derived(getUser());

	onMount(() => {
		clearGameState();
	});

	async function createGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if ((nickname?.length ?? 0) <= 0) {
			window.alert('Please make sure to input a nickname');
			return;
		}

		const response = await fetchWithAuth(authedUser, '/api/game/create', {
			method: 'POST',
			body: JSON.stringify({
				nickname
			})
		});

		const body = await response.json();

		gameId = body.gameId;
		const newGameCode = body.gameCode;

		if (soundHasntPlayed()) {
			playMainTrack();
		}
		// goto the game lobby if game code available. where you can see who's joined.
		goto(`/game/lobby?gameId=${gameId}&gameCode=${newGameCode}`);
	}

	async function joinGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if ((nickname?.length ?? 0) <= 0 && (gameCode?.length ?? 0) <= 0) {
			window.alert('Please make sure to input a nickname and game code.');
			return;
		}
		const response = await fetchWithAuth(authedUser, '/api/game/join', {
			method: 'POST',
			body: JSON.stringify({
				nickname: nickname.slice(0, 9),
				gameCode: gameCode.join('')
			})
		});

		if (response.ok) {
			const body = await response.json();
			gameId = body.gameId;
			if (gameId !== undefined) {
				// goto the game lobby if game code available. where you can see who's joined.
				if (soundHasntPlayed()) {
					playMainTrack();
				}
				goto(`/game/lobby?gameId=${gameId}&gameCode=${gameCode?.join('')}`);
			}
		}
	}
	let firstChar: Input;
	let secondChar: Input;
	let thirdChar: Input;
	let fourthChar: Input;
</script>

<div class="flex h-full grow flex-col items-center overflow-auto px-5 pb-16 pt-4">
	<div
		class="flex max-w-[25em] grow flex-col items-center gap-4 [@media_(min-height:800px)]:gap-10"
	>
		<div class="relative mt-3 flex max-h-56 grow flex-col overflow-clip rounded-lg bg-purple-800">
			<enhanced:img src="/static/logo.png" alt="the Meme Master logo" class="drop-shadow-lg" />
			<div
				class="font-cursive absolute bottom-0 flex w-full items-center justify-center py-3 text-5xl font-bold italic text-amber-300 [text-shadow:0px_0px_10px_black]"
			>
				Meme Master
			</div>
		</div>
		<Input
			bind:value={nickname}
			placeholder="Enter a nickname..."
			containerClass="bg-slate-100 focus-within:drop-shadow-lg lg:mt-5 [@media_(min-height:800px)]:mt-0"
			class="text-2xl"
		/>
		<Button
			onclick={() => {
				createGame();
			}}
			class="drop-shadow-lg lg:my-5 [@media_(min-height:800px)]:my-0"
		>
			Create Game
		</Button>
		<div
			class="flex flex-row gap-2 *:bg-blue-200 lg:mb-5 [&_input]:h-14 [&_input]:w-14 [&_input]:text-center [&_input]:text-2xl [&_input]:caret-transparent [@media_(min-height:800px)]:mb-0"
		>
			<!-- place to put the code -->
			<Input
				bind:this={firstChar}
				placeholder="0"
				bind:value={gameCode[0]}
				oninput={({ currentTarget }) => {
					const value = currentTarget.value;
					if (value.length > 0) {
						secondChar?.focus();
					}
					if (value.length > 1) {
						gameCode[0] = value.at(-1) ?? '';
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class={clsx('h-10 w-9 items-center justify-center', gameCode[0] !== '' && 'font-extrabold')}
			/>
			<Input
				bind:this={secondChar}
				placeholder="0"
				bind:value={gameCode[1]}
				oninput={({ currentTarget }) => {
					const value = currentTarget.value;
					if (value.length > 0) {
						thirdChar?.focus();
					} else {
						firstChar?.focus();
					}
					if (value.length > 1) {
						gameCode[1] = value.at(-1) ?? '';
					}
				}}
				onkeydown={({ key }) => {
					if (key === 'Backspace' && gameCode[1] === '') {
						firstChar?.focus();
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class={clsx('h-10 w-9 items-center justify-center', gameCode[1] !== '' && 'font-extrabold')}
			/>
			<Input
				bind:this={thirdChar}
				placeholder="0"
				bind:value={gameCode[2]}
				oninput={({ currentTarget }) => {
					const value = currentTarget.value;
					if (value.length > 0) {
						fourthChar?.focus();
					} else {
						secondChar?.focus();
					}
					if (value.length > 1) {
						gameCode[2] = value.at(-1) ?? '';
					}
				}}
				onkeydown={({ key }) => {
					if (key === 'Backspace' && gameCode[2] === '') {
						secondChar?.focus();
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class={clsx('h-10 w-9 items-center justify-center', gameCode[2] !== '' && 'font-extrabold')}
			/>
			<Input
				bind:this={fourthChar}
				placeholder="0"
				bind:value={gameCode[3]}
				oninput={({ currentTarget }) => {
					const value = currentTarget.value;
					if (value.length < 1) {
						thirdChar?.focus();
					} else {
						gameCode[3] = value.at(-1) ?? '';
					}
				}}
				onkeydown={({ key }) => {
					if (key === 'Backspace' && gameCode[3] === '') {
						thirdChar?.focus();
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				size={1}
				class={clsx('h-10 w-9 items-center justify-center', gameCode[3] !== '' && 'font-extrabold')}
			/>
		</div>
		<Button
			class="drop-shadow-lg"
			onclick={() => {
				joinGame();
			}}>Join Game</Button
		>
	</div>
	<div
		class="text-light flex max-w-[40em] flex-col items-center gap-4 text-balance py-10 text-center font-serif"
	>
		<h1 class="text-2xl font-bold">A Worthy Cause</h1>
		<p class="">
			Maysiah is a 3 lbs. 10 oz. baby girl born just a couple days ago to a young single mother with
			the father having passed away tragically. Please as you enjoy this game, consider donating to
			help this family starting out.
			<br />
			<a
				href="https://donate.stripe.com/6oEeVXfdjgIY6LC3cf"
				target="_blank"
				class="my-3 rounded-lg bg-pink-400 p-2 text-center font-bold text-white">Donate here</a
			>
		</p>
		<p>
			Please reach out to me here (<a
				href="https://www.linkedin.com/in/melchi-dulcio/"
				target="_blank"
				class="inline underline underline-offset-4">including my Linkedin for reassurance</a
			>) if you have any follow up questions. Also, if you're interested, consider leaving your
			email for updates on this family.
		</p>
	</div>
</div>
