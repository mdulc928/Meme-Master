export type Participant = {
	user: string; // User ID
	points: number;
	joinedAt: Date;
	role: 'judge' | 'player';
	cardsWon: {
		winningAsset: string; // the winning caption
		wonAsset: string; // the won image
		round: number; // the round this was won
	}[];
	nickname: string;
};
