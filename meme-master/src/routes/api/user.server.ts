import { db } from '$lib/server/firebase';
import type { DecodedIdToken } from 'firebase-admin/auth';

export const USER_COLLECTION = 'users';

export async function saveUser({ token }: { token: DecodedIdToken }) {
	// check users collection for user with uid or the authID
	// if user doesn't exist, create user
	const userQuery = await db.collection(USER_COLLECTION).where('uid', '==', token.uid).get();

	if (userQuery.empty) {
		const authIdQuery = await db.collection(USER_COLLECTION).where('authId', '==', token.uid).get();
		if (!authIdQuery.empty) {
			userQuery.docs.push(...authIdQuery.docs);
		}
	}

	let user;
	if (userQuery.empty) {
		await db
			.collection(USER_COLLECTION)
			.doc(token.uid)
			.set({
				uid: token.uid,
				email: token.email ?? '',
				name: token.name ?? '',
				authId: token.uid, // this is because we want to be able to change the authId in the future
				photoUrl: token.picture ?? '',
				created: new Date()
			});
		user = await db.collection(USER_COLLECTION).doc(token.uid).get();
	} else {
		user = userQuery.docs[0];
	}
	return {
		success: true,
		id: user?.id
	};
}
