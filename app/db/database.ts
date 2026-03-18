
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
                created_at INTEGER,
                userId TEXT, -- Added for multi-user support
                mood TEXT -- Added for mood tracking
            );
        `);

        // Migration to add userId column if it doesn't exist
        const tableInfo = await db.getAllAsync('PRAGMA table_info(entries)');
        const columns = (tableInfo as any[]).map(col => col.name);

        if (!columns.includes('userId')) {
            try {
                await db.execAsync('ALTER TABLE entries ADD COLUMN userId TEXT');
                console.log('Added userId column');
            } catch (e) { console.log('Column userId likely exists', e); }
        }

        if (!columns.includes('mood')) {
            try {
                await db.execAsync('ALTER TABLE entries ADD COLUMN mood TEXT');
                console.log('Added mood column');
            } catch (e) { console.log('Column mood likely exists', e); }
        }

        console.log('Database initialized');
    } catch (error) {
        console.log('Error initializing database:', error);
    }
};

// Insert a new entry
export const insertEntry = async (text: string, attachments: any[], userId: string, mood: string = 'neutral') => {
    if (!db) await initDB();
    const date = new Date().toISOString().split('T')[0];
    const createdAt = Date.now();
    const attachmentsJson = JSON.stringify(attachments);

    try {
        const result = await db.runAsync(
            'INSERT INTO entries (date, text, attachments, created_at, userId, mood) VALUES (?, ?, ?, ?, ?, ?)',
            date, text, attachmentsJson, createdAt, userId, mood
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.log('Error inserting entry:', error);
        throw error;
    }
};

// Import an entry (for restore)
export const importEntry = async (entry: any, userId: string) => {
    if (!db) await initDB();
    // Check if duplicate exists (by created_at and userId)
    const existing: any = await db.getFirstAsync(
        'SELECT id FROM entries WHERE created_at = ? AND userId = ?',
        entry.created_at, userId
    );

    if (existing) {
        console.log('Skipping duplicate entry:', entry.created_at);
        return;
    }

    try {
        await db.runAsync(
            'INSERT INTO entries (date, text, attachments, created_at, userId, mood) VALUES (?, ?, ?, ?, ?, ?)',
            entry.date, entry.text, entry.attachments, entry.created_at, userId, entry.mood || 'neutral'
        );
    } catch (error: any) {
        console.log('Error importing entry:', error);
        throw new Error(error.message || "Failed to insert entry into database");
    }
};

// Get all entries for a user
export const getEntries = async (userId: string) => {
    if (!db) await initDB();
    try {
        const result = await db.getAllAsync('SELECT * FROM entries WHERE userId = ? ORDER BY created_at DESC', userId);
        return result;
    } catch (error) {
        console.log('Error fetching entries:', error);
        return [];
    }
};

// Get entries for a specific date and user
export const getEntriesForDate = async (date: string, userId: string) => {
    if (!db) await initDB();
    try {
        const result = await db.getAllAsync('SELECT * FROM entries WHERE date = ? AND userId = ? ORDER BY created_at DESC', date, userId);
        return result;
    } catch (error) {
        console.log('Error fetching entries for date:', error);
        return [];
    }
};

// Get single entry by ID and user
export const getEntryById = async (id: number, userId: string) => {
    if (!db) await initDB();
    try {
        const result: any = await db.getFirstAsync('SELECT * FROM entries WHERE id = ? AND userId = ?', id, userId);
        return result;
    } catch (error) {
        console.log('Error fetching entry by id:', error);
        return null;
    }
};

// Delete entry by ID and user
export const deleteEntry = async (id: number, userId: string) => {
    if (!db) await initDB();
    try {
        await db.runAsync('DELETE FROM entries WHERE id = ? AND userId = ?', id, userId);
        return true;
    } catch (error) {
        console.log('Error deleting entry:', error);
        return false;
    }
};
