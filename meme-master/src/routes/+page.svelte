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
		goto(`/gameLobby?gameId=${gameId}&gameCode=${gameCode}`);
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
		goto(`/gameLobby?gameId=${gameId}&gameCode=${gameCode}`);
	}
</script>

<div class="flex h-full grow flex-col items-center justify-end gap-5 px-5 py-16">
	<div class="w-full grow rounded-lg bg-blue-100">Image</div>
	<Input bind:value={nickname} placeholder="Enter a nickname..." containerClass="bg-slate-100" />
	<Button
		onclick={() => {
			createGame();
		}}
	>
		Create Game
	</Button>
	<div class="flex flex-row gap-2 *:bg-blue-200">
		<!-- place to put the code -->
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
			containerClass="w-fit"
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
			containerClass="w-fit"
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
			containerClass="w-fit"
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
			containerClass="w-fit"
			class="h-10 w-9 items-center justify-center"
		/>
	</div>
	<Button
		onclick={() => {
			joinGame();
		}}>Join Game</Button
	>
</div>
