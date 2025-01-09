import { db, app, storage } from '$lib/server/firebase'; // Firestore instance

type Image = {
	uid: string;
	url: string;
	hash: string;
	owner: string;
};

type Caption = {
	uid: string;
	text: string;
	owner: string;
	categories: string[];
};

type User = {
	uid: string;
	authId: string;
	createdAt: string;
};

type Submission = {
	uid: string;
	caption: string; // the id of tied caption
	round: number;
	timeSubmitted: Date;
	points: {
		amount: number;
		user: User;
	}[];
};

type ParticipantCard = {
	userId?: string; // User ID
	captionId: string; // Caption ID
	status?: 'active' | 'discarded';
};

type Participant = {
	user: string; // User ID
	points: number;
	joinedAt: Date;
	role: 'judge' | 'player';
	cardsWon: string[];
	nickname: string;
};

type CardStack =
	| {
			captions: Caption[];
			captionIndex: number;
			locked: string;
			type: 'caption';
	  }
	| {
			images: Image[];
			type: 'image';
			imageIndex: number;
	  };

type Game = {
	uid: string;
	code: string; // max 4 characters
	createdBy: string; // User ID
	createdAt: Date;
	startedAt?: Date;
	endedAt?: Date;
	statusStartedAt: Date;
	pausedLengths?: number[];
	round: number;
	status: 'waiting' | 'deciding' | 'voting' | 'paused' | 'ended';
	participants: Participant[];
};

const GAME_COLLECTION = 'games';
const CAPTION_COLLECTION = 'captions';
const IMAGE_COLLECTION = 'images';
const SUBMISSION_COLLECTION = 'submissions';
const PARTICIPANT_CARDS_COLLECTION = 'participantCards';
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

	// Check if the user is already a participant
	const isParticipant = gameData.participants.some(
		(participant: Participant) => participant.user === userId
	);
	if (isParticipant) {
		throw new Error('User is already a participant in this game.');
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

	const gameData = gameSnapshot.data();

	// Check if the user is the creator
	if (gameData.creator !== userId) {
		throw new Error('Only the creator can start the game.');
	}

	// Set initial game settings
	const now = new Date();
	const updatedGameData = {
		status: 'deciding',
		round: 1,
		startedAt: now
	};

	// Generate card stacks
	const participants = gameData.participants;
	const numParticipants = participants.length;

	const captionCards = await generateCaptionCards(numParticipants, participants);
	const imageCards = await generateImageCards(numParticipants);

	// Save card stacks to subcollections
	const cardStackRef = gameRef.collection(CARDSTACK_COLLECTION);
	await cardStackRef.doc('captions').set(captionCards);
	await cardStackRef.doc('images').set({ cards: imageCards });

	// Update the game document
	await gameRef.update(updatedGameData);

	return { success: true };
}

// Subfunction: Generate caption cards
async function generateCaptionCards(
	numParticipants: number,
	participants: Participant[]
): Promise<{ cards: ParticipantCard[]; cardIndex: number }> {
	const totalCaptionCards = 40 * numParticipants;
	const captionSnapshot = await db.collection(CAPTION_COLLECTION).limit(totalCaptionCards).get();

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
		cards: shuffledCaptions,
		cardIndex
	};
}

// Subfunction: Generate image cards
async function generateImageCards(numParticipants: number): Promise<string[]> {
	const totalImageCards = 8 * numParticipants;
	const imageSnapshot = await db.collection(IMAGE_COLLECTION).limit(totalImageCards).get();

	if (imageSnapshot.empty || imageSnapshot.size < totalImageCards) {
		throw new Error('Not enough image cards available.');
	}

	const images = imageSnapshot.docs.map((doc) => doc.id);
	return shuffleArray(images); // Precompute the order by shuffling
}

// Utility: Shuffle an array
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
	authToken,
	gameId,
	captionId
}: {
	authToken: { userId: string };
	gameId: string;
	captionId: string;
}): Promise<{ success: boolean; submissionId?: string }> {
	// we will have to handle race conditions in here, but for now, we won't worry about it.
	const { userId } = authToken;

	// Fetch the game
	const gameRef = db.collection(GAME_COLLECTION).doc(gameId);
	const gameSnapshot = await gameRef.get();

	if (!gameSnapshot.exists) {
		throw new Error('Game not found.');
	}

	const gameData = gameSnapshot.data();

	// Check if the user is a participant
	const participant = gameData.participants.find((p: Participant) => p.user === userId);
	if (!participant) {
		throw new Error('User is not a participant in this game.');
	}

	// Check game status
	if (gameData.status !== 'deciding') {
		throw new Error('Game is not in the deciding phase.');
	}

	// Fetch the caption card stack
	const cardStackRef = gameRef.collection(CARDSTACK_COLLECTION).doc('captions');
	const cardStackSnapshot = await cardStackRef.get();

	if (!cardStackSnapshot.exists) {
		throw new Error('Card stack not found.');
	}

	const cardStackData = cardStackSnapshot.data();

	const userCard = cardStackData.cards.find(
		(card: ParticipantCard) =>
			card.userId === userId && card.captionId === captionId && card.status === 'active'
	);

	if (!userCard) {
		throw new Error("Caption is not in the user's active cards or has already been used.");
	}

	// Check if the caption has already been submitted
	const submissionRef = gameRef.collection(SUBMISSION_COLLECTION);
	const submissionsSnapshot = await submissionRef
		.where('round', '==', gameData.round)
		.where('caption', '==', captionId)
		.get();

	if (!submissionsSnapshot.empty) {
		throw new Error('Caption has already been submitted.');
	}

	// Create a new submission
	const submission: Submission = {
		caption: captionId,
		round: gameData.round,
		timeSubmitted: new Date(),
		points: []
	};

	const newSubmissionRef = await submissionRef.add(submission);
	const submissionId = newSubmissionRef.id;

	// Change the caption's status from 'active' to 'discarded'
	const cardIndex = cardStackData.cards.findIndex(
		(card: ParticipantCard) => card.userId === userId && card.captionId === captionId
	);
	if (cardIndex !== -1) {
		cardStackData.cards[cardIndex].status = 'discarded';
	}

	// Allocate the next available card to the user's active cards
	const nextCardIndex = cardStackData.cardIndex;
	const nextCard = cardStackData.cards[nextCardIndex];

	if (nextCard && !nextCard.userId) {
		nextCard.userId = userId;
		nextCard.status = 'active';
		cardStackData.cardIndex += 1; // Update the card index
	} else {
		throw new Error('No more available cards in the deck.');
	}

	// Update the card stack in Firestore
	await cardStackRef.set(cardStackData);

	return { success: true, newCaptionCard: nextCard.captionId };
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

export async function submitVote(
	authToken: { userId: string },
	gameId: string,
	captionId: string,
	points: number
) {
	const { userId } = authToken;
	// Fetch the game
	const gameRef = db.collection(GAME_COLLECTION).doc(gameId);
	const gameSnapshot = await gameRef.get();

	if (!gameSnapshot.exists) {
		throw new Error('Game not found.');
	}

	const gameData = gameSnapshot.data();

	// Check if the game is in voting state
	if (gameData.status !== 'voting') {
		throw new Error('Game is not in voting state.');
	}

	// Check if the user is a participant
	const participant = gameData.participants.find((p: any) => p.user === userId);
	if (!participant) {
		throw new Error('User is not a participant in this game.');
	}

	// Check voting eligibility and points
	const maxPoints =
		participant.role === 'judge'
			? 1000 * gameData.participants.length
			: Math.min(3000, 3000 * gameData.participants.length);

	if (points % 100 !== 0 || points > maxPoints || points <= 0) {
		throw new Error('Invalid points allocation.');
	}

	const hasVoted = gameData.votes?.some(
		(vote: any) => vote.userId === userId && vote.captionId === captionId
	);
	if (hasVoted) {
		throw new Error('User has already voted for this caption.');
	}

	// Add the vote to the game's vote collection
	const voteData = {
		userId,
		captionId,
		points,
		votedAt: new Date()
	};

	await gameRef.update({
		votes: FieldValue.arrayUnion(voteData)
	});

	// Update caption's points
	const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(captionId);
	await submissionRef.update({
		points: db.FieldValue.increment(points),
		voters: db.FieldValue.arrayUnion({ userId, points })
	});

	// Check if all participants have voted
	const allParticipants = gameData.participants.length;
	const totalVotes = (gameData.votes || []).length + 1; // Include the current vote
	const allVoted = totalVotes >= allParticipants;

	if (allVoted) {
		// Determine if the game ends or continues
		const winner = gameData.participants.find((p: any) => p.cardsWon.length >= 8);
		// we will need to account for pause time too in the future, but let's not worry about it for now.
		const isGameOver = !!winner || new Date() >= gameData.expirationTime;

		const nextStatus = isGameOver ? 'ended' : 'deciding';
		const updateData = {
			status: nextStatus
		};

		if (!isGameOver) {
			updateData['round'] = gameData.round + 1;
		}

		await gameRef.update(updateData);

		if (isGameOver) {
			return { success: true, message: `Game Over. Winner: ${winner?.nickname || 'None'}` };
		}
	}

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
