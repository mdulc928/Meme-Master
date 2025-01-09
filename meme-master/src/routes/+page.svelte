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
		}

		const response = await fetchWithAuth(authedUser, '/api/game/create', {
			method: 'POST',
			body: JSON.stringify({
				nickname
			})
		});

		// goto the game lobby if game code available. where you can see who's joined.
	}

	async function joinGame() {
		let authedUser = user;
		if (!authedUser && auth) {
			authedUser = await signIn(auth);
		}

		if ((nickname?.length ?? 0) <= 0 && (gameCode?.length ?? 0) <= 0) {
			window.alert('Please make sure to input a nickname and game code.');
		}

		const response = await fetchWithAuth(authedUser, '/api/game/join', {
			method: 'POST',
			body: JSON.stringify({
				nickname,
				gameCode
			})
		});

		// goto the game lobby if game code available. where you can see who's joined.
	}
</script>

<div class="flex flex-col items-center justify-center gap-3 p-2">
	<Input bind:value={nickname} placeholder="Enter a nickname..." />
	<Button
		onclick={() => {
			createGame();
		}}>Create Game</Button
	>
	<div class="flex flex-row *:h-10 *:w-8">
		<!-- place to put the code -->
		<Input
			placeholder="0"
			onchange={({ currentTarget }) => {
				const value = currentTarget.value;
				console.log('value 1', value);
			}}
		/>
		<Input placeholder="0" />
		<Input placeholder="0" />
		<Input placeholder="0" />
	</div>
	<Button
		onclick={() => {
			joinGame();
		}}>Join Game</Button
	>
</div>
