export type Participant = {
	user: string; // User ID
	points: number;
	joinedAt: Date;
	role: 'judge' | 'player';
	cardsWon: {
		winningAssetType: 'caption' | 'image';
		winningAsset: string; // the winning caption
		wonAssetType: 'caption' | 'image';
		wonAsset: string; // the won image
		round: number; // the round this was won
	}[];
	nickname: string;
};
