import { GAME_COLLECTION } from '$lib/utils/collections';
import { collection, doc, limit, onSnapshot, query, where, getDoc } from '@firebase/firestore';
import { db } from '$lib/utils/firebase.client';
import type { Game } from '$lib/Game.svelte.js';
import {
	CAPTION_COLLECTION,
	type MemeCaption,
	type MemeImage
} from '$lib/components/Caption/Assets.svelte';
import { fetchWithAuth } from '$lib/utils/auth.client.svelte';
import type { User } from '@firebase/auth';
import { SvelteMap } from 'svelte/reactivity';

let game: Game | undefined = $state();
export function getGame() {
	return game;
}
export function setGame(updates: Game | undefined) {
	game = updates;
}

export function clearGameState() {
	setGame(undefined);
	setUserCurrentCards(undefined);
	setSubmittedCaptions(undefined);
	setRoundImage(undefined);
	setUserSubmission(undefined);
	setNewCard(undefined);
}

let userCards: MemeCaption[] | undefined = $state();
export function getUserCurrentCards() {
	return userCards;
}
export function setUserCurrentCards(updates: MemeCaption[] | undefined) {
	userCards = updates;
}

let submittedCaptions: SvelteMap<string, MemeCaption> | undefined = $state();
export function getSubmittedCaptions() {
	return submittedCaptions;
}
export function setSubmittedCaptions(updates: SvelteMap<string, MemeCaption> | undefined) {
	submittedCaptions = updates;
}
export function addSubmittedCaption(update: MemeCaption) {
	const cards = getSubmittedCaptions() ?? new SvelteMap();
	cards.set(update.uid, update);
	// todo this might be uncessary; I don't know yet.
	setSubmittedCaptions(cards);
}

let roundImage: MemeImage | undefined = $state();
export function getRoundImage() {
	return roundImage;
}
export function setRoundImage(update: MemeImage | undefined) {
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
		const oldGame = getGame();
		if (oldGame && game && oldGame.status === 'voting' && game.status === 'deciding') {
			setUserSubmission(undefined);
			setSubmittedCaptions(undefined);
		}
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

// the users submissions are returned by the submit caption;
let userSubmission: string | undefined = $state();
export function getUserSubmission() {
	return userSubmission;
}
export function setUserSubmission(updates: string | undefined) {
	userSubmission = updates;
}
export async function fetchUserSubmission({ gameId, user }: { gameId: string; user: User }) {
	const response = await fetchWithAuth(user, `/api/game/getUserSubmission`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId })
	});

	if (!response.ok) {
		throw new Error('Failed to get user submission');
	}
	const { submissionId } = await response.json();
	// todo add zod validation
	return submissionId as string | undefined;
}

// todo make sure this only is the judge and game is in a judge voted state
export async function fetchSubmissionUser({
	gameId,
	submissionId,
	user
}: {
	gameId: string;
	submissionId: string;
	user: User;
}) {
	const response = await fetchWithAuth(user, `/api/game/getSubmissionUser`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId, submissionId })
	});

	if (!response.ok) {
		throw new Error('Failed to get submission user');
	}
	const { userId } = await response.json();
	// todo add zod validation
	return userId as string;
}

export async function submitCaption({
	gameId,
	captionId,
	user
}: {
	gameId: string;
	captionId: string;
	user: User;
}) {
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
	const { submissionId, nextCardId } = await response.json();
	setUserSubmission(submissionId);
	// todo add zod validation
	return { nextCardId };
}

export async function startVoting({ gameId, user }: { gameId: string; user: User }) {
	const response = await fetchWithAuth(user, `/api/game/startVoting`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId })
	});

	if (!response.ok) {
		throw new Error('Failed to start voting');
	}
}

export async function submitVote({
	gameId,
	captionId,
	points,
	user
}: {
	gameId: string;
	captionId: string;
	points: number;
	user: User;
}) {
	const response = await fetchWithAuth(user, `/api/game/submitVote`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId, captionId, points })
	});

	if (!response.ok) {
		throw new Error('Failed to submit vote');
	}
	const data = await response.json();
	// todo add zod validation
	return data;
}

let newCard = $state<string | undefined>();
export function getNewCard() {
	return newCard;
}
export function setNewCard(card: string | undefined) {
	newCard = card;
}

export async function discardCaption({
	gameId,
	captionId,
	user
}: {
	gameId: string;
	captionId: string;
	user: User;
}) {
	const response = await fetchWithAuth(user, `/api/game/discardCaption`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ gameId, captionId })
	});

	if (!response.ok) {
		throw new Error('Failed to discard caption');
	}
	const { nextCard } = await response.json();
	// todo add zod validation
	return nextCard as string;
}

export async function getCaptionCard({ captionId }: { captionId: string }) {
	if (!db) {
		throw new Error('Firestore is not initialized.');
	}
	const captionDoc = await getDoc(doc(db, CAPTION_COLLECTION, captionId));
	if (!captionDoc.exists()) {
		throw new Error('Caption not found');
	}
	const caption = captionDoc.data() as MemeCaption;
	return caption;
}

let userTotalPoints: number | undefined = $state();
export function getUserTotalPoints() {
	return userTotalPoints;
}
export function setUserTotalPoints(points: number | undefined) {
	userTotalPoints = points;
}
export function createUserTotalPointsListener({ user }: { user: User }) {
	if (!db) {
		throw new Error('Firestore is not initialized.');
	}
	console.log('Creating user total points listener for user', user);
	// Create a reference to the collection and set up the query
	const gameCollectionRef = collection(db, GAME_COLLECTION);
	const userQuery = query(
		gameCollectionRef,
		where('participantUserIds', 'array-contains', user.uid)
	);

	// Set up the listener
	const unsubscribe = onSnapshot(userQuery, (snapshot) => {
		let totalPoints = 0;
		snapshot.docs.forEach((doc) => {
			const game = doc.data() as Game;
			totalPoints += game.participants.find((p) => p.user === user.uid)?.points ?? 0;
		});

		setUserTotalPoints(totalPoints);
	});

	// Return the unsubscribe function to allow stopping the listener
	return unsubscribe;
}
