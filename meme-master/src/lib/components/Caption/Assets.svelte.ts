import { db, storage } from '$lib/utils/firebase.client';
import type { User } from '@firebase/auth';
import {
	collection,
	doc,
	getDocs,
	query,
	where,
	WriteBatch,
	writeBatch
} from '@firebase/firestore';
import { getDownloadURL, uploadBytes, ref } from '@firebase/storage';
import Papa from 'papaparse';

export const CAPTION_COLLECTION = 'captions';
export const IMAGE_COLLECTION = 'images';

export type MemeImage = {
	uid: string;
	url: string;
	hash: string;
	owner: string;
	createdAt: Date;
	attribution?: {
		source: string; // this could be a URL or a name
		display: string; // this what to display to the user
	};
};

export type MemeCaption = {
	uid: string;
	text: string;
	owner: string;
	categories: string[];
	createdAt: Date;
};

// Function to handle caption file upload and processing
export async function handleCaptionUpload({
	captionFiles,
	user
}: {
	captionFiles: FileList;
	user?: User;
}) {
	if (db === undefined) {
		return;
	}
	if (captionFiles.length > 0) {
		const batch = writeBatch(db);
		const parseTasks: Promise<MemeCaption[]>[] = [];
		Array.from(captionFiles).forEach(async (file) => {
			if (file.type === 'text/csv') {
				parseTasks.push(parseCsv({ file, batch, user }));
			} else {
				alert('Please upload a valid CSV file.');
			}
		});
		if (parseTasks.length === 0) {
			return;
		}
		await Promise.all(parseTasks);
		await batch.commit();
		console.log('All captions saved successfully');
	} else {
		alert('Please select a caption file to upload.');
	}
}

// Function to parse CSV file into Caption objects

// Function to parse CSV file into Caption objects using PapaParse
export async function parseCsv({
	file,
	batch,
	user
}: {
	file: File;
	batch: WriteBatch;
	user?: User;
}): Promise<MemeCaption[]> {
	return new Promise((resolve, reject) => {
		Papa.parse<{ text: string; categories: string }>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			complete: (results) => {
				const { data, errors, meta } = results;

				// Handle parsing errors
				if (errors.length > 0) {
					console.error('CSV Parsing Errors:', errors);
					return reject(new Error('Error parsing CSV file.'));
				}

				// Validate required headers
				const headers = meta.fields || [];
				if (!headers.includes('text') || !headers.includes('categories')) {
					return reject(
						new Error('Invalid CSV format: Missing required headers (text, categories)')
					);
				}

				const captions: MemeCaption[] = [];

				// Ensure 'db' is defined
				if (db === undefined) {
					console.warn('Database is undefined. No captions will be parsed.');
					return resolve([]);
				}

				data.forEach((row, index) => {
					const text = row.text?.trim();
					const categoriesField = row.categories;

					if (!text || !categoriesField) {
						console.warn(`Skipping row ${index + 2} due to missing 'text' or 'categories'.`);
						return;
					}

					const categories = categoriesField
						.split(',')
						.map((cat: string) => cat.trim())
						.filter(Boolean);

					const caption: MemeCaption = {
						uid: '',
						text,
						owner: user?.uid ?? 'admin',
						categories,
						createdAt: new Date()
					};
					if (db === undefined) {
						console.warn('Database is undefined. No captions will be parsed.');
						return resolve([]);
					}
					const docRef = doc(collection(db, CAPTION_COLLECTION)); // Automatically generates a unique ID
					caption.uid = docRef.id; // Assign the generated ID to the caption object
					console.log(`Adding caption: ${JSON.stringify(caption)}`);
					batch.set(docRef, caption);
					captions.push(caption);
				});

				resolve(captions);
			},
			error: (error) => {
				console.error('PapaParse Error:', error);
				reject(error);
			}
		});
	});
}

// Function to handle image file upload
export async function handleImageUpload({
	imageFiles,
	attributions,
	user
}: {
	imageFiles: FileList;
	attributions: Map<string, { source: string; display: string }>;
	user?: User;
}) {
	console.log('atributions', attributions);
	if (db === undefined || storage === undefined) {
		return;
	}
	if (imageFiles.length > 0) {
		const batch = writeBatch(db);
		const uploadTasks: Promise<[string, MemeImage] | undefined>[] = [];
		const uploadImage = async ({ file }: { file: File }) => {
			const resizedFile = await resizeImage(file, 800, 800); // Resize the image
			const hash = await generateHash(resizedFile); // Compute hash of resized file

			if (db === undefined || storage === undefined) {
				// the reason why we need to check here again is
				// because the function is async and the db and storage
				// might be undefined by the time the function is called
				return;
			}
			// Check for duplicate hash in Firestore
			const q = query(collection(db, IMAGE_COLLECTION), where('hash', '==', hash));
			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				console.log(`Duplicate file detected with hash: ${hash}`);
				return; // Skip uploading duplicate file
			}

			const docRef = doc(collection(db, IMAGE_COLLECTION)); // Automatically generates a unique ID

			// Upload original file to Firebase Storage
			const storageRef = ref(storage, `${IMAGE_COLLECTION}/${docRef.id}/${file.name}`);
			await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(storageRef);

			const image: MemeImage = {
				uid: docRef.id, // Use the generated ID
				url: downloadURL, // Use the Firebase Storage URL
				hash,
				owner: user?.uid ?? 'admin', // Replace with dynamic owner if needed
				createdAt: new Date(),
				attribution: attributions.get(file.name) ?? { source: '', display: '' }
			};
			batch.set(docRef, image);
			return [file.name, image] as [string, MemeImage];
		};
		Array.from(imageFiles).forEach((file) => uploadTasks.push(uploadImage({ file })));
		if (uploadTasks.length === 0) {
			return;
		}
		const images = await Promise.all(uploadTasks);
		await batch.commit();
		console.log('All images saved successfully');
		return new Map(images.filter((image): image is [string, MemeImage] => image !== undefined));
	} else {
		alert('Please select image files to upload.');
	}
}

// Helper function to resize an image
export async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<File> {
	const img = document.createElement('img');
	img.src = URL.createObjectURL(file);

	await new Promise((resolve) => (img.onload = resolve));

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	let width = img.width;
	let height = img.height;

	if (width > height && width > maxWidth) {
		height = (height * maxWidth) / width;
		width = maxWidth;
	} else if (height > maxWidth) {
		width = (width * maxHeight) / height;
		height = maxHeight;
	}

	canvas.width = width;
	canvas.height = height;
	ctx?.drawImage(img, 0, 0, width, height);

	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(new File([blob], file.name, { type: file.type }));
			}
		}, file.type);
	});
}

// Helper function to generate a hash for a file (e.g., for uniqueness and comparison)
export async function generateHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer(); // Read file content
	const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer); // Generate SHA-256 hash
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert hash buffer to byte array
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex string
}
