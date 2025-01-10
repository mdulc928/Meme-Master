import type { Participant } from './components/Participant/Participant.svelte.js';

export type Game = {
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
