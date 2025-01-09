import { error, json } from '@sveltejs/kit';
import { decodeToken } from '../../shared.server';
import { createNewGame, joinGame, startGame } from './game.server';
import { saveUser } from '../../user.server';

export async function POST({ request, params }) {
	const { action } = params;
	const decodedToken = await decodeToken(request.headers);

	if (!decodedToken) {
		return error(401, 'Sorry, please sign in to continue.');
	}
	const userDoc = await saveUser({ token: decodedToken });
	if (!userDoc.success) {
		return error(500, 'Sorry, there was an error saving your user data.');
	}
	const userId = userDoc.id;
	const body = await request.json();
	switch (action) {
		case 'create': {
			const { nickname } = body;
			return json(await createNewGame({ userId, nickname }));
		}
		case 'join': {
			const { gameCode, nickname } = body;
			return json(await joinGame({ userId, gameCode, nickname }));
		}
		case 'start': {
			const { gameId } = body;
			return json(await startGame({ userId, gameId }));
		}
		default:
			return error(404, 'Not found');
	}
}
