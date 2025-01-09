import { GAME_COLLECTION } from '$lib/utils/collections';
import { collection, limit, onSnapshot, query, where } from '@firebase/firestore';
import { firestore } from '$lib/utils/firebase.client';
import type { Game } from '$lib/Game.svelte.js';

export function createGameParticipantQuery({ gameId }: { gameId: string }) {
	if (!firestore) {
		throw new Error('Firestore is not initialized.');
	}

	// Create a reference to the collection and return the query
	const gameCollectionRef = collection(firestore, GAME_COLLECTION);
	return query(gameCollectionRef, where('uid', '==', gameId));
}

export function createGameStateListener({
	gameId,
	callback
}: {
	gameId: string;
	callback: (game: Game) => void;
}) {
	if (!firestore) {
		throw new Error('Firestore is not initialized.');
	}

	// Create a reference to the collection and set up the query
	const gameCollectionRef = collection(firestore, GAME_COLLECTION);
	const gameQuery = query(gameCollectionRef, where('uid', '==', gameId), limit(1));

	// Set up the listener
	const unsubscribe = onSnapshot(gameQuery, (snapshot) => {
		const game = snapshot.docs[0]?.data() as Game | undefined;
		if (game) {
			callback(game);
		}
	});

	// Return the unsubscribe function to allow stopping the listener
	return unsubscribe;
}
