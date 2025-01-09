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
