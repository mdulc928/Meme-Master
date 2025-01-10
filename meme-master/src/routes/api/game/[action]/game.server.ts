import type { MemeImage } from '$lib/components/Caption/Assets.svelte.js';
import type { MemeCaption } from '$lib/components/Caption/Assets.svelte.js';
import type { Participant } from '$lib/components/Participant/Participant.svelte.js';
import type { Game, Submission } from '$lib/Game.svelte.js';
import { db } from '$lib/server/firebase'; // Firestore instance
import { GAME_COLLECTION, SUBMISSION_COLLECTION } from '$lib/utils/collections';
import { getGame } from '../../../game/game.client.svelte';

type User = {
	uid: string;
	authId: string;
	createdAt: string;
};

type ParticipantCard = {
	userId?: string; // User ID
	captionId: string; // Caption ID
	status?: 'active' | 'discarded';
};

type CardStack =
	| {
			cards: ParticipantCard[];
			cardsIndex: number;
			locked?: string;
			type: 'caption';
	  }
	| {
			cards: string[];
			type: 'image';
			cardsIndex: number;
	  };

const CAPTION_COLLECTION = 'captions';
const IMAGE_COLLECTION = 'images';
const CARDSTACK_COLLECTION = 'cardStacks';

/* create a new game
    - requires a user id and nickname, which we will get from the auth token.
    - create a new game with the user as the creator
    - generate a game code (based on the last game code that was generated)
    - immediately save that game to firestore.
    - add the user to the participants list (since they are the creator)
       = we might their nickname here.
    - update firestore
    - return the game ID and the game code
*/

export async function createNewGame({ userId, nickname }: { userId: string; nickname: string }) {
	// Query Firestore for the most recent game code
	console.log('creating new game');
	const gamesRef = db.collection(GAME_COLLECTION).orderBy('code', 'desc').limit(1);
	const latestGameSnapshot = await gamesRef.get();

	// we can simplify this by just using a regular number, but not right now.
	let newGameCode = '0000'; // Default starting code
	if (!latestGameSnapshot.empty) {
		const latestGame = latestGameSnapshot.docs[0].data();
		newGameCode = incrementGameCode(latestGame.code);
	}

	// Create game object
	const newGameId = db.collection(GAME_COLLECTION).doc().id;
	const newGame: Game = {
		uid: newGameId,
		code: newGameCode,
		createdBy: userId,
		createdAt: new Date(),
		participants: [
			{
				user: userId,
				points: 0,
				joinedAt: new Date(),
				role: 'judge', // Creator starts as a judge
				cardsWon: [],
				nickname: nickname
			}
		],
		statusStartedAt: new Date(),
		status: 'waiting', // Initial status
		round: 0
	};

	// Save the new game to Firestore
	await db.collection(GAME_COLLECTION).doc(newGameId).set(newGame);
	console.log('game created');
	// Add game to user's created games
	return { gameId: newGameId, gameCode: newGameCode };
}

// save nickname

/* join a game
    - requires a user id, nickname, game code
    - requires a game code
    - get the game from firestore
    - add the user to the participants list, 
        - role is player.
        - joinedAt is now.
        and the rest....
    - update firestore
    - return the game ID
*/

export async function joinGame({
	userId,
	nickname,
	gameCode
}: {
	userId: string;
	nickname: string;
	gameCode: string;
}) {
	// Find the game by code
	const gameQuery = db.collection(GAME_COLLECTION).where('code', '==', gameCode).limit(1); // we will need to account for the limit of 4 characters, but we won't worry about it for nwo.
	const gameSnapshot = await gameQuery.get();

	if (gameSnapshot.empty) {
		throw new Error('Game with the specified code not found.');
	}

	const gameDoc = gameSnapshot.docs[0];
	const gameData = gameDoc.data();

	if (gameData.status !== 'waiting') {
		return { gameId: gameDoc.id };
	}

	// Check if the user is already a participant
	const isParticipant = gameData.participants.some(
		(participant: Participant) => participant.user === userId
	);
	if (isParticipant) {
		return { gameId: gameDoc.id };
	}

	// Add the user as a participant
	const newParticipant: Participant = {
		user: userId,
		points: 0,
		joinedAt: new Date(),
		role: 'player', // Role is 'player' for participants joining a game
		cardsWon: [],
		nickname: nickname
	};

	gameData.participants.push(newParticipant);

	// Update Firestore with the new participant
	await gameDoc.ref.update({
		participants: gameData.participants
	});

	return { gameId: gameDoc.id };
}

/* start a game
    - requires a user id, which we will get from the auth token.
    - requires a game ID
    - get the game from firestore
    - check if the user is the creator of the game
    - set the game status to 'deciding'
    - set the game round to 1
    - set the game startedAt to now
    - generate the card stacks
        - 50 captions per participant, but only 10 active cards
          - also precompute the order of the cards
        - one for images for each round
            - we will start with a preset number of rounds, and when we start getting near that, we will get more images.
            - also precompute the order of the images
    - update firestore
    - return sucess
*/

export async function startGame({ userId, gameId }: { userId: string; gameId: string }) {
	// Fetch the game
	const gameRef = db.collection(GAME_COLLECTION).doc(gameId);
	const gameSnapshot = await gameRef.get();

	if (!gameSnapshot.exists) {
		throw new Error('Game not found.');
	}

	const gameData = gameSnapshot.data() as Game;

	// Check if the user is the creator
	if (gameData.createdBy !== userId) {
		// throw new Error('User is not the creator of this game.');
		return { success: true };
	}

	if (gameData.status !== 'waiting') {
		//	throw new Error('Game is not in the waiting state.');
		return { success: true };
	}

	// Set initial game settings
	const now = new Date();
	const updatedGameData = {
		status: 'deciding',
		round: 1,
		startedAt: now,
		statusStartedAt: now
	};

	// Generate card stacks
	const participants = gameData.participants;
	const numParticipants = participants.length;

	if (numParticipants < 3) {
		throw new Error('Not enough participants to start the game.');
	}

	const captionCards = await generateCaptionCards(numParticipants, participants);
	const imageCards = await generateImageCards(numParticipants);

	// Save card stacks to subcollections
	// todo someday worry about concurrency issues
	const cardStackRef = gameRef.collection(CARDSTACK_COLLECTION);
	await cardStackRef.doc('captions').set(captionCards);
	await cardStackRef.doc('images').set(imageCards);

	// Update the game document
	await gameRef.update(updatedGameData);

	return { success: true };
}

async function getCardStack(gameId: string, type: 'captions' | 'images'): Promise<CardStack> {
	const cardStackRef = db.collection(GAME_COLLECTION).doc(gameId).collection(CARDSTACK_COLLECTION);
	const cardStackSnapshot = await cardStackRef.doc(type).get();

	if (!cardStackSnapshot.exists) {
		throw new Error('Card stack not found.');
	}
	// todo add zod validation
	return cardStackSnapshot.data() as CardStack;
}

export async function getUserCardStack({
	userId,
	cardStack: rawCardStack,
	gameId
}: {
	userId: string;
	cardStack?: CardStack;
	gameId?: string;
}): Promise<MemeCaption[]> {
	let cardStack = rawCardStack;
	if ((gameId === '' || gameId === undefined) && cardStack === undefined) {
		return [];
	}

	if (cardStack === undefined && gameId !== '' && gameId !== undefined) {
		// get the card stack from firestore
		cardStack = await getCardStack(gameId, 'captions');
	}

	if (cardStack === undefined) {
		return [];
	}

	if (cardStack.type === 'caption') {
		const userCards = cardStack.cards
			.slice(0, cardStack.cardsIndex)
			.filter((card) => card.userId === userId && card.status === 'active');
		const captionSnapshot = await db
			.collection(CAPTION_COLLECTION)
			.where(
				'uid',
				'in',
				userCards.map((card) => card.captionId)
			)
			.get();
		if (captionSnapshot.empty) {
			return [];
		}
		return captionSnapshot.docs.map((doc) => doc.data() as MemeCaption);
	} else {
		return [];
	}
}

export async function getRoundImage({
	cardStack: rawCardStack,
	gameId
}: {
	cardStack?: CardStack;
	gameId?: string;
}): Promise<MemeImage | undefined> {
	let cardStack = rawCardStack;
	if ((gameId === '' || gameId === undefined) && cardStack === undefined) {
		throw new Error('Cannot process request.');
	}

	if (cardStack === undefined && gameId !== '' && gameId !== undefined) {
		// get the card stack from firestore
		cardStack = await getCardStack(gameId, 'images');
	}

	if (cardStack === undefined) {
		throw new Error('No card stack found.');
	}
	if (cardStack.type === 'image') {
		const currentCard = cardStack.cards[cardStack.cardsIndex];
		const imageSnapshot = await db.collection(IMAGE_COLLECTION).doc(currentCard).get();
		if (!imageSnapshot.exists) {
			throw new Error('Image not found.');
		}
		return imageSnapshot.data() as MemeImage;
	} else {
		throw new Error('Invalid card stack type.');
	}
}

// Subfunction: Generate caption cards
async function generateCaptionCards(
	numParticipants: number,
	participants: Participant[]
): Promise<Extract<CardStack, { type: 'caption' }>> {
	const totalCaptionCards = 40 * numParticipants;
	const captionSnapshot = await db.collection(CAPTION_COLLECTION).get();

	if (captionSnapshot.empty || captionSnapshot.size < totalCaptionCards) {
		throw new Error('Not enough caption cards available.');
	}

	const captions = captionSnapshot.docs.map((doc) => ({
		captionId: doc.id
	}));

	// Shuffle cards to precompute order
	const shuffledCaptions: ParticipantCard[] = shuffleArray(captions);

	// Allocate 10 cards per participant in order
	let cardIndex = 0;

	for (const participant of participants) {
		for (let i = 0; i < 10; i++) {
			shuffledCaptions[cardIndex] = {
				userId: participant.user,
				captionId: shuffledCaptions[cardIndex].captionId,
				status: 'active'
			};
			cardIndex++;
		}
	}

	return {
		type: 'caption',
		cards: shuffledCaptions.slice(0, totalCaptionCards),
		cardsIndex: cardIndex
	};
}

// Subfunction: Generate image cards
async function generateImageCards(
	numParticipants: number
): Promise<Extract<CardStack, { type: 'image' }>> {
	// cut the number in half so that we make it harder to have ties.
	const totalImageCards = 4 * numParticipants;
	const imageSnapshot = await db.collection(IMAGE_COLLECTION).get();

	if (imageSnapshot.empty || imageSnapshot.size < totalImageCards) {
		throw new Error('Not enough image cards available.');
	}

	const images = imageSnapshot.docs.map((doc) => doc.id);
	return {
		cards: shuffleArray(images).slice(0, totalImageCards),
		type: 'image',
		cardsIndex: 0
	}; // Precompute the order by shuffling
}

// Utility: Shuffle an array Fisher-Yates style
function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

/* pause a game
    - requires a user id, which we will get from the auth token.
    - requires a game ID
    - get the game from firestore
    - check if the user is the creator of the game
    - set the game status to 'paused'
    - set the game pausedAt to now
    - update firestore
    - return sucess
*/

export async function pauseGame({}) {}

/* resume a game
    - requires a user id, which we will get from the auth token.
    - requires a game ID
    - get the game from firestore
    - check if the user is the creator of the game
    - set the game status to 'deciding'
    - add the length of the pause to the game pausedLengths
    - update firestore
    - return sucess
*/

export async function resumeGame({}) {}

/*
submit a caption
    - requires a user id, which we will get from the auth token.
    - requires a game ID
    - requires a caption ID
    - get the game from firestore
    - check if the user is a participant
    - check if the game status is 'deciding'
    - check if the user has the caption in their active cards
    - check if the caption has not been submitted before
    - add the caption to the submissions subcollection for the caption.
    - change the caption's status from the user's 'active' cards to 'discarded'
    - add the next available card to the user 'active' cards (set the user ID and the status)
    - update the game card stacks index
    - update firestore
    - return the new caption ID
*/

export async function submitCaption({
	userId,
	gameId,
	captionId
}: {
	userId: string;
	gameId: string;
	captionId: string;
}): Promise<{ success: boolean }> {
	// todo we will have to handle race conditions in here, but for now, we won't worry about it.

	// Fetch the game
	const gameRef = db.collection(GAME_COLLECTION).doc(gameId);
	const gameSnapshot = await gameRef.get();

	if (!gameSnapshot.exists) {
		throw new Error('Game not found.');
	}

	// no need for validation here because all updates to this state is controlled by the server.
	const gameData = gameSnapshot.data() as Game;

	// Check if the user is a participant
	const participant = gameData.participants.find((p: Participant) => p.user === userId);
	if (!participant) {
		throw new Error('User is not a participant in this game.');
	}

	if (participant.role === 'judge') {
		throw new Error('Judges cannot submit a caption.');
	}

	// Check game status
	if (gameData.status !== 'deciding') {
		throw new Error('Game is not in the deciding phase.');
	}

	// Fetch the caption card stack
	// todo narrow this type.
	const cardStack = await getCardStack(gameId, 'captions');

	if (cardStack.type !== 'caption') {
		throw new Error('Invalid card stack type.');
	}

	const userCardIndex = cardStack.cards.findIndex(
		(card: ParticipantCard) =>
			card.userId === userId && card.captionId === captionId && card.status === 'active'
	);

	if (userCardIndex === -1) {
		throw new Error("Caption is not in the user's active cards or has already been used.");
	}

	// Check if the caption has already been submitted
	const submissionCollectionRef = gameRef.collection(SUBMISSION_COLLECTION);
	const submissionsSnapshot = await submissionCollectionRef
		.where('round', '==', gameData.round)
		.get();

	const currentActiveCards = cardStack.cards.slice(0, cardStack.cardsIndex);
	const roundSubmissions = submissionsSnapshot.docs.map((doc) => doc.data() as Submission);

	if (
		roundSubmissions.some((s) => s.caption === captionId) ||
		roundSubmissions.some((s) =>
			currentActiveCards.some((c) => c.captionId === s.caption && c.userId === userId)
		)
	) {
		throw new Error('Caption has already been submitted.');
	}

	const submissionRef = submissionCollectionRef.doc();
	// Create a new submission
	const submission: Submission = {
		uid: submissionRef.id,
		caption: captionId,
		round: gameData.round,
		timeSubmitted: new Date(),
		points: []
	};

	await submissionRef.set(submission);

	cardStack.cards[userCardIndex].status = 'discarded';

	// Allocate the next available card to the user's active cards
	const nextCardIndex = cardStack.cardsIndex;
	const nextCard = cardStack.cards[nextCardIndex];

	if (nextCard) {
		nextCard.userId = userId;
		nextCard.status = 'active';
		cardStack.cardsIndex += 1; // Update the card index
	} else {
		throw new Error('No more available cards in the deck.');
	}

	// Update the card stack in Firestore
	await db
		.collection(GAME_COLLECTION)
		.doc(gameId)
		.collection(CARDSTACK_COLLECTION)
		.doc('captions')
		.set(cardStack);

	// check if we should start voting
	const thisRoundSubmissions = await submissionCollectionRef
		.where('round', '==', gameData.round)
		.count()
		.get();
	const allPlayerRoles = gameData.participants.length;

	// minus 1 because the judge doesn't submit a caption.
	const allSubmitted = thisRoundSubmissions.data().count === allPlayerRoles - 1;
	if (allSubmitted) {
		// todo use a batch writer for all this stuff.
		await gameRef.update({
			status: 'voting',
			statusStartedAt: new Date()
		});
	}
	return { success: true };
}

/*
submit a vote
    - requires a user id, which we will get from the auth token.
    - requires a game ID
    - requires a caption ID
    - get the game from firestore
    - check if the user is a participant
    - check if the game status is 'voting'
    - check if the user has not voted for this caption before and how many points they have left to vote
      - judges have 1000 points per participant including themselves. They get only 1 vote per round.
      - players have 3000 or less points total depending on the number of participants. You can award points in increments (things divisible by) of 100
    - add the points to the submitted caption along with the user ID and when they voted
    - check if the all participants have voted, if so, set the game status to 'deciding'
				- Increment the round
		- check if the game is over, if so, set the game status to 'ended'
			 - this means either a player has won 8 rounds or the game time has expired
    - update firestore
    - return sucess
*/

export async function submitVote({
	userId,
	gameId,
	captionId,
	points
}: {
	userId: string;
	gameId: string;
	captionId: string;
	points: number;
}) {
	// Fetch the game
	const gameRef = db.collection(GAME_COLLECTION).doc(gameId);
	const gameSnapshot = await gameRef.get();

	if (!gameSnapshot.exists) {
		throw new Error('Game not found.');
	}

	const gameData = gameSnapshot.data() as Game;

	// Check if the game is in voting state
	if (gameData.status !== 'voting') {
		throw new Error('Game is not in voting state.');
	}

	// Check if the user is a participant
	const participantIndex = gameData.participants.findIndex((p: Participant) => p.user === userId);
	const participant = gameData.participants[participantIndex];
	if (!participant) {
		throw new Error('User is not a participant in this game.');
	}

	const judge = gameData.participants.find((p: Participant) => p.role === 'judge');

	// Check voting eligibility and points
	const maxPoints =
		participant.role === 'judge'
			? 1000 * gameData.participants.length
			: Math.min(3000, 500 * (gameData.participants.length - 1));

	if (points % 100 !== 0 || points > maxPoints || points <= 0) {
		throw new Error('Invalid points allocation.');
	}

	const submissionCollectionRef = gameRef.collection(SUBMISSION_COLLECTION);
	const submissionQuery = submissionCollectionRef.where('round', '==', gameData.round);
	const submissionSnapshot = await submissionQuery.get();
	if (submissionSnapshot.empty) {
		throw new Error('No submissions found.');
	}

	const allSubmissions = submissionSnapshot.docs.map((doc) => doc.data() as Submission);

	const judgeHasVoted = allSubmissions.some((s) => s.points.some((p) => p.user === judge?.user));
	if (judgeHasVoted && participant.role === 'judge') {
		throw new Error('Judge has already voted for this round.');
	}

	const cardStack = await getCardStack(gameId, 'captions');
	if (cardStack.type !== 'caption') {
		throw new Error('Invalid card stack type.');
	}
	const activeCards = cardStack.cards.slice(0, cardStack.cardsIndex);

	const allUsersCards = activeCards.filter((card) => card?.userId === userId);

	if (allUsersCards.some((card) => card.captionId === captionId)) {
		throw new Error('User cannot vote for their own caption.');
	}

	const votedCaption = allSubmissions.find((s) => s.caption === captionId);
	if (!votedCaption) {
		throw new Error('Caption not found in submissions.');
	}

	votedCaption.points.push({ user: userId, amount: points, awardedAt: new Date() });
	await submissionCollectionRef.doc(votedCaption.uid).set(votedCaption);

	const pointTotal = votedCaption.points.reduce((acc, p) => acc + p.amount, 0);
	const cardOwner = activeCards.find((card) => card.captionId === captionId)?.userId;
	const cardOwnerParticipantIndex = gameData.participants.findIndex((p) => p.user === cardOwner);
	const cardOwnerParticipant = gameData.participants[cardOwnerParticipantIndex];
	if (cardOwnerParticipant) {
		cardOwnerParticipant.points = pointTotal;
		gameData.participants[cardOwnerParticipantIndex] = cardOwnerParticipant;
	}

	if (participant.role === 'judge') {
		participant.role = 'player';
		gameData.participants[participantIndex] = participant;
		gameData.round += 1;
		gameData.status = 'deciding';
		gameData.statusStartedAt = new Date();

		const pointsPerParticiant: [string, number][] = [];
		allSubmissions.forEach((s) => {
			let totalPoints = 0;
			s.points.forEach((p) => {
				totalPoints += p.amount;
			});
			const cardOwner = activeCards.find((card) => card.captionId === s.caption)?.userId;
			if (cardOwner) {
				pointsPerParticiant.push([cardOwner, totalPoints]);
			}
		});

		pointsPerParticiant.sort((a, b) => b[1] - a[1]);
		const winner = pointsPerParticiant[0];
		const winnerParticipantIndex = gameData.participants.findIndex((p) => p.user === winner[0]);
		const winnerParticipant = gameData.participants[winnerParticipantIndex];
		if (winnerParticipant) {
			winnerParticipant.cardsWon.push(captionId);
			gameData.participants[winnerParticipantIndex] = winnerParticipant;
		}
		if (winnerParticipant.cardsWon.length >= 8) {
			gameData.status = 'ended';
			gameData.endedAt = new Date();
		}
	}

	await gameRef.update(gameData);

	return { success: true };
}

// discard a caption
export async function discardCaption({}) {}

function incrementGameCode(currentCode: string): string {
	const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const base = charset.length;

	// Convert the current code into a base-36 number
	let value = currentCode
		.split('')
		.reverse()
		.reduce((acc, char, index) => acc + charset.indexOf(char) * Math.pow(base, index), 0);

	// Increment the value
	value += 1;

	// Convert the new value back into the 4-character alphanumeric code
	let newCode = '';
	while (value > 0) {
		newCode = charset[value % base] + newCode;
		value = Math.floor(value / base);
	}

	// Pad with leading zeros if necessary
	return newCode.padStart(4, '0');
}
