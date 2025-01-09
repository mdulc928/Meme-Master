import { initializeApp } from '@firebase/app';
import { getAnalytics } from '@firebase/analytics';
import { initializeFirestore } from '@firebase/firestore';
import { getAuth } from '@firebase/auth';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_MEASUREMENT_ID,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET
} from '$env/static/public';
import { browser } from '$app/environment';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
	measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = browser ? initializeApp(firebaseConfig) : undefined;
const analytics = browser && app ? getAnalytics(app) : undefined;
const firestore = browser && app ? initializeFirestore(app, {}) : undefined;
const auth = browser && app ? getAuth(app) : undefined;

export { app, analytics, firestore, auth };
