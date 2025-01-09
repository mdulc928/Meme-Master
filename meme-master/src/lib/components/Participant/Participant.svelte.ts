export type Participant = {
	user: string; // User ID
	points: number;
	joinedAt: Date;
	role: 'judge' | 'player';
	cardsWon: string[];
	nickname: string;
};
