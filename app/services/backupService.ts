import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getEntries, importEntry } from '../db/database';

export const backupData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not logged in");

    const entries: any[] = await getEntries(userId);
    if (!entries.length) return 0;

    const batch = writeBatch(db);
    const entriesRef = collection(db, `users/${userId}/entries`);

    entries.forEach((entry) => {
        // Use created_at as ID to ensure uniqueness and easy deduplication
        const docRef = doc(entriesRef, entry.created_at.toString());
        batch.set(docRef, {
            ...entry,
            synced_at: Date.now()
        });
    });

    await batch.commit();
    return entries.length;
};

export const restoreData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not logged in");

    const entriesRef = collection(db, `users/${userId}/entries`);
    const snapshot = await getDocs(entriesRef);

    if (snapshot.empty) return 0;

    let restoredCount = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        await importEntry(data, userId);
        restoredCount++;
    }

    return restoredCount;
};
