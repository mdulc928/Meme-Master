import { GAME_COLLECTION, SUBMISSION_COLLECTION } from '$lib/utils/collections';
import { collection, limit, onSnapshot, query, where } from '@firebase/firestore';
import { db } from '$lib/utils/firebase.client';
import type { Game } from '$lib/Game.svelte.js';
import type { MemeCaption, MemeImage } from '$lib/components/Caption/Assets.svelte';
import { fetchWithAuth } from '$lib/utils/auth.client.svelte';
import type { User } from '@firebase/auth';

let game: Game | undefined = $state();
export function getGame() {
	return game;
}
export function setGame(updates: Game) {
	game = updates;
}

let userCards: MemeCaption[] | undefined = $state();
export function getUserCards() {
	return userCards;
}
export function setUserCards(updates: MemeCaption[]) {
	userCards = updates;
}

let roundImage: MemeImage | undefined = $state();
export function getRoundImage() {
	return roundImage;
}
export function setRoundImage(update: MemeImage) {
	roundImage = update;
}

export function createGameStateListener({ gameId }: { gameId: string }) {
	if (!db) {
		throw new Error('Firestore is not initialized.');
	}
	console.log('Creating game state listener for game', gameId);
	// Create a reference to the collection and set up the query
	const gameCollectionRef = collection(db, GAME_COLLECTION);
	const gameQuery = query(gameCollectionRef, where('uid', '==', gameId), limit(1));

	// Set up the listener
	const unsubscribe = onSnapshot(gameQuery, (snapshot) => {
		const game = snapshot.docs[0]?.data() as Game | undefined;
		if (game) {
			setGame(game);
		}
	});

	// Return the unsubscribe function to allow stopping the listener
	return unsubscribe;
}

export async function fetchUserCards({ gameId, user }: { gameId: string; user: User }) {
	const response = await fetchWithAuth(user, `/api/game/getUserCards`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId })
	});

	if (!response.ok) {
		throw new Error('Failed to get user cards');
	}
	const data = await response.json();
	// todo add zod validation
	return data as MemeCaption[];
}

export async function fetchRoundImage({ gameId, user }: { gameId: string; user: User }) {
	const response = await fetchWithAuth(user, `/api/game/getRoundImage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId })
	});

	if (!response.ok) {
		throw new Error('Failed to get round image');
	}
	const data = await response.json();
	// todo add zod validation
	return data as MemeImage;
}

export async function submitCaption({ gameId, captionId, user }: { gameId: string; captionId: string; user: User }) {
	const response = await fetchWithAuth(user, `/api/game/submitCaption`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId, captionId })
	});

	if (!response.ok) {
		throw new Error('Failed to submit caption');
	}
	const data = await response.json();
	// todo add zod validation
	return data;
}