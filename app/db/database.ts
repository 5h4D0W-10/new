
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

// Initialize the database
export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('diary.db');
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                text TEXT,
                attachments TEXT, -- JSON string of Attachment[]
                created_at INTEGER
            );
        `);
        console.log('Database initialized');
    } catch (error) {
        console.log('Error initializing database:', error);
    }
};

// Insert a new entry
export const insertEntry = async (text: string, attachments: any[]) => {
    if (!db) await initDB();
    const date = new Date().toISOString().split('T')[0];
    const createdAt = Date.now();
    const attachmentsJson = JSON.stringify(attachments);

    try {
        const result = await db.runAsync(
            'INSERT INTO entries (date, text, attachments, created_at) VALUES (?, ?, ?, ?)',
            date, text, attachmentsJson, createdAt
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.log('Error inserting entry:', error);
        throw error;
    }
};

// Get all entries
export const getEntries = async () => {
    if (!db) await initDB();
    try {
        const result = await db.getAllAsync('SELECT * FROM entries ORDER BY created_at DESC');
        return result;
    } catch (error) {
        console.log('Error fetching entries:', error);
        return [];
    }
};

// Get entries for a specific date
export const getEntriesForDate = async (date: string) => {
    if (!db) await initDB();
    try {
        const result = await db.getAllAsync('SELECT * FROM entries WHERE date = ? ORDER BY created_at DESC', date);
        return result;
    } catch (error) {
        console.log('Error fetching entries for date:', error);
        return [];
    }
};

// Get single entry by ID
export const getEntryById = async (id: number) => {
    if (!db) await initDB();
    try {
        const result: any = await db.getFirstAsync('SELECT * FROM entries WHERE id = ?', id);
        return result;
    } catch (error) {
        console.log('Error fetching entry by id:', error);
        return null;
    }
};
