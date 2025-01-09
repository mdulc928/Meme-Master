import { PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET } from '$env/static/public';
import { initializeApp, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

try {
	app = getApp();
} catch (e) {
	app = initializeApp({
		projectId: PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET
	});
	console.log('Firebase app already initialized', e);
}

export { app };
export const db = getFirestore();
export const storage = getStorage();
export const auth = getAuth();
