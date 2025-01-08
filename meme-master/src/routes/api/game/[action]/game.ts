// this the file to handle the game state
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { initializeApp, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App;

try {
	app = getApp();
} catch (error) {
	app = initializeApp();
	console.error('Firebase app already initialized', error);
}

export { app };
export const firestore = new Firestore();
export const storage = new Storage();
export const auth = getAuth();

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
	caption: Caption;
	round: number;
	points: {
		amount: number;
		user: User;
	}[];
};

type ParticipantCard = {
	user: User;
	pastCards: Caption[];
	activeCards: Caption[]; // 10 cards
};

type Participant = {
	user: User;
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
	  }
	| {
			images: Image[];
	  };

type Game = {
	uid: string;
	gameCode: string; // max 4 characters
	createdBy: User;
	createdAt: Date;
	startedAt: Date;
	endedAt: Date;
	statusStartedAt: Date;
	pausedLengths: number[];
	round: number;
	status: 'notStarted' | 'deciding' | 'voting' | 'paused' | 'ended';
	imagePerRound: Image[]; //string
	participants: Participant[];
	discardedCaptions: Caption[];
};

const GAME_COLLECTION = 'games';
const USER_COLLECTION = 'users';
const CAPTION_COLLECTION = 'captions';
const IMAGE_COLLECTION = 'images';
const SUBMISSION_COLLECTION = 'submissions';
const PARTICIPANT_CARDS_COLLECTION = 'participantCards';
const CARDSTACK_COLLECTION = 'cardStacks';

/* create a new game
    - requires a user id, which we will get from the auth token.
    - create a new game with the user as the creator
    - generate a game code (based on the last game code that was generated)
    - immediately save that game to firestore.
    - add the user to the participants list (since they are the creator)
       = we might their nickname here.
    - update firestore
    - return the game ID and the game code
*/

async function createGame({}) {}

/* join a game
    - requires a user id, which we will get from the auth token.
    - requires a game code
    - get the game from firestore
    - add the user to the participants list, 
        - role is player.
        - joinedAt is now.
        - prompt the user for a nickname
    - update firestore
    - return the game ID
*/

export async function joinGame({}) {}

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

export async function startGame({}) {}

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
    - add the caption to the submissions list along with the round and time submitted
    - move the caption from the user's active cards to their discarded cards
    - refill the user's active cards with a new caption
    - update the game card stacks index
    - update firestore
    - return sucess
*/

export async function submitCaption({}) {}

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
      - players have 3000 or less points total depending on the number of participants. You can award points in increments of 100
    - add the points to the submitted caption
    - check if the all participants have voted, and check if the game is over.
    - if the game is over, set the game status to 'ended'
    - if the just round is over, set the game status to 'deciding'
    - update firestore
    - return sucess
*/

export async function submitVote({}) {}

export async function decodeToken(headers: Headers) {
	const authHeader = headers.get('authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.split('Bearer ')[1];
		return auth.verifyIdToken(token);
	}
}
