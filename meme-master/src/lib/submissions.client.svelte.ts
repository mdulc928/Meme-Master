import type { Submission } from '$lib/Game.svelte';
import { GAME_COLLECTION, SUBMISSION_COLLECTION } from '$lib/utils/collections';
import { db } from '$lib/utils/firebase.client';
import { query, collection, where, onSnapshot } from '@firebase/firestore';

let submissions: Submission[] | undefined = $state();
export function getSubmissions() {
	return submissions;
}

export function setSubmissions(updates: Submission[] | undefined) {
	submissions = updates;
}

// the submissions submitted are returned by the submit caption so we need 
// to store these submission in localstorage. 
// this will allow us to tally point in the frontend without too 
// much worry about race conditions.

export function createSubmissionsListener({
	gameId,
	gameRound
}: {
	gameId: string;
	gameRound: number;
}) {
	if (!db) {
		throw new Error('Firestore is not initialized.');
	}
	console.log('Creating submissions listener for game', gameId);
	// Create a reference to the collection and set up the query
	const submissionsQuery = query(
		collection(db, GAME_COLLECTION, gameId, SUBMISSION_COLLECTION),
		where('round', '==', gameRound)
	);

	// Set up the listener
	const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
		const submissions = snapshot.docs.map((doc) => doc.data() as Submission);
		setSubmissions(submissions);
	});

	// Return the unsubscribe function to allow stopping the listener
	return unsubscribe;
}