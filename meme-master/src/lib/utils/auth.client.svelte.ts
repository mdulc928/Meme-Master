import {
	type User,
	getIdToken,
	signInAnonymously,
	setPersistence,
	browserLocalPersistence,
	type Auth
} from '@firebase/auth';

let user: User | undefined = $state();

export function getUser() {
	return user;
}

export function setUser(newUser: User | undefined) {
	user = newUser;
}

export async function getAuthHeader(user: User | undefined) {
	if (user === undefined) return undefined;
	const token = await getIdToken(user);
	if (token === undefined) return undefined;
	return {
		Authorization: `Bearer ${token}`
	};
}

export async function fetchWithAuth(user: User | undefined, url: string, options: RequestInit) {
	const headers = await getAuthHeader(user);
	return fetch(url, {
		...options,
		headers: {
			...options.headers,
			...headers
		}
	});
}

export async function signIn(auth: Auth) {
	await setPersistence(auth, browserLocalPersistence);
	const userCredential = await signInAnonymously(auth);
	user = userCredential.user;
	return userCredential.user;
}

// sign user in anonymously using persistence local so
// that the user is remembered even when the session ends
