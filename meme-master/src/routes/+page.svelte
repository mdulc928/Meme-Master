<script lang="ts">
	import Button from './Button.svelte';
	import { fetchWithAuth, signIn, getUser } from '$lib/utils/auth.client.svelte';
	import { auth } from '$lib/utils/firebase.client';
	import Input from './Input.svelte';
	import { goto } from '$app/navigation';

	let gameId: number | undefined = $state();
	let nickname: string | undefined = $state();
	let gameCode: string | undefined = $state();

	let user = $derived(getUser());

	async function createGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if (nickname?.length ?? 0 <= 0) {
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
		gameCode = body.gameCode;

		// goto the game lobby if game code available. where you can see who's joined.
		goto(`/game/lobby?gameId=${gameId}&gameCode=${gameCode}`);
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
				nickname,
				gameCode
			})
		});

		const body = await response.json();
		gameId = body.gameId;

		// goto the game lobby if game code available. where you can see who's joined.
		goto(`/game/lobby?gameId=${gameId}&gameCode=${gameCode}`);
	}
</script>

<div class="flex h-full grow flex-col items-center px-5 pb-16 pt-4">
	<div
		class="flex max-w-[25em] grow flex-col items-center gap-4 [@media_(min-height:800px)]:gap-10"
	>
		<div class="relative flex h-0 max-h-80 grow flex-col overflow-clip rounded-lg bg-purple-800">
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
				placeholder="0"
				onchange={({ currentTarget }) => {
					const value = currentTarget.value;
					if (gameCode) {
						gameCode += value;
					} else {
						gameCode = value;
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class="h-10 w-9 items-center justify-center"
			/>
			<Input
				placeholder="0"
				onchange={({ currentTarget }) => {
					const value = currentTarget.value;
					console.log('value 1', value);
					if (gameCode) {
						gameCode += value;
					} else {
						gameCode = value;
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class="h-10 w-9 items-center justify-center"
			/>
			<Input
				placeholder="0"
				onchange={({ currentTarget }) => {
					const value = currentTarget.value;
					console.log('value 1', value);
					if (gameCode) {
						gameCode += value;
					} else {
						gameCode = value;
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				class="h-10 w-9 items-center justify-center"
			/>
			<Input
				placeholder="0"
				onchange={({ currentTarget }) => {
					const value = currentTarget.value;
					console.log('value 1', value);
					if (gameCode) {
						gameCode += value;
					} else {
						gameCode = value;
					}
				}}
				containerClass="w-fit focus-within:drop-shadow-lg"
				size={1}
				class="h-14 w-14 text-center text-2xl"
			/>
		</div>
		<Button
			class="drop-shadow-lg"
			onclick={() => {
				joinGame();
			}}>Join Game</Button
		>
	</div>
</div>
