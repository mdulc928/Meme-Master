import { db, storage } from '$lib/utils/firebase.client';
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
export async function handleCaptionUpload({ captionFiles }: { captionFiles: FileList }) {
	if (db === undefined) {
		return;
	}
	if (captionFiles.length > 0) {
		const batch = writeBatch(db);
		const parseTasks: Promise<MemeCaption[]>[] = [];
		Array.from(captionFiles).forEach(async (file) => {
			if (file.type === 'text/csv') {
				parseTasks.push(parseCsv({ file, batch }));
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
export async function parseCsv({
	file,
	batch
}: {
	file: File;
	batch: WriteBatch;
}): Promise<MemeCaption[]> {
	const text = await file.text();
	const rows = text.split('\n').filter((row) => row.trim() !== ''); // Remove empty rows
	const headers = rows[0].split(',').map((header) => header.trim());

	if (!headers.includes('text') || !headers.includes('categories')) {
		throw new Error('Invalid CSV format: Missing required headers (text, categories)');
	}

	const captions: MemeCaption[] = [];
	const textIndex = headers.indexOf('text');
	const categoryIndex = headers.indexOf('categories');

	if (db === undefined) {
		// the reason why we need to check here again is because the db
		// might be undefined by the time the function is called
		// not sure this will ever happen but it's better to be safe
		return [];
	}

	for (let i = 1; i < rows.length; i++) {
		const values =
			rows[i].match(/("[^"]*"|[^,]+)/g)?.map((value) => value.replace(/^"|"$/g, '').trim()) || [];

		if (values.length !== headers.length) {
			console.warn(`Skipping row ${i} due to mismatched column count.`);
			continue;
		}

		const caption = {
			uid: '',
			text: values[textIndex], // todo we may need to ensure duplication is not possible here too in the future
			owner: 'admin',
			categories: values[categoryIndex].split(',').map((category) => category.trim()),
			createdAt: new Date()
		};
		const docRef = doc(collection(db, 'captions')); // Automatically generates a unique ID
		caption.uid = docRef.id; // Assign the generated ID to the caption object
		console.log(`Adding caption: ${JSON.stringify(caption)}`);
		batch.set(docRef, caption);
		captions.push(caption);
	}

	return captions;
}

// Function to handle image file upload
export async function handleImageUpload({
	imageFiles,
	attributions
}: {
	imageFiles: FileList;
	attributions: Map<string, { source: string; display: string }>;
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
			const q = query(collection(db, 'images'), where('hash', '==', hash));
			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				console.log(`Duplicate file detected with hash: ${hash}`);
				return; // Skip uploading duplicate file
			}

			const docRef = doc(collection(db, 'images')); // Automatically generates a unique ID

			// Upload original file to Firebase Storage
			const storageRef = ref(storage, `images/${docRef.id}/${file.name}`);
			await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(storageRef);

			const image: MemeImage = {
				uid: docRef.id, // Use the generated ID
				url: downloadURL, // Use the Firebase Storage URL
				hash,
				owner: 'admin', // Replace with dynamic owner if needed
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
