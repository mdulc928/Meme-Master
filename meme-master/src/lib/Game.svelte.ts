import type { Participant } from './components/Participant/Participant.svelte.js';

export type Game = {
	uid: string;
	code: string; // max 4 characters
	createdBy: string; // User ID
	createdAt: Date;
	startedAt?: Date;
	endedAt?: Date;
	statusMessage?: string;
	statusStartedAt: Date;
	pausedLengths?: number[];
	round: number;
	status: 'waiting' | 'deciding' | 'voting' | 'paused' | 'ended';
	participantUserIds: string[]; // used for quick lookup
	participants: Participant[];
};

/**
 * A submission is a meme captionn sent by a participant..
 *
 * Note: We are not storing who submitted since there is an element of anonymity.
 * for when voting is happening.
 */

export type Submission = {
	uid: string; // firestore id
	caption: string; // the id of tied caption
	round: number;
	timeSubmitted: Date;
	points: {
		amount: number;
		user: string; // the user id
		awardedAt: Date;
	}[];
};
