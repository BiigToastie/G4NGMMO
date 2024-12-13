import sqlite3 from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite';

interface Character {
    userId: number;
    gender: 'male' | 'female';
    slot: number;
}

export class Database {
    private static instance: Database | null = null;
    private db: SQLiteDatabase | null = null;

    private constructor() {}

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async initialize(): Promise<void> {
        try {
            this.db = await open({
                filename: './game.db',
                driver: sqlite3.Database
            });

            await this.createTables();
            console.log('Datenbank erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der Datenbankinitialisierung:', error);
            throw error;
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Datenbank nicht initialisiert');

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                userId INTEGER NOT NULL,
                gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
                slot INTEGER NOT NULL CHECK(slot IN (1, 2)),
                PRIMARY KEY (userId, slot)
            )
        `);
    }

    public async getCharacters(userId: number): Promise<Character[]> {
        if (!this.db) throw new Error('Datenbank nicht initialisiert');

        return await this.db.all<Character[]>(
            'SELECT * FROM characters WHERE userId = ?',
            userId
        );
    }

    public async getCharacter(userId: number, slot: number): Promise<Character | undefined> {
        if (!this.db) throw new Error('Datenbank nicht initialisiert');

        return await this.db.get<Character>(
            'SELECT * FROM characters WHERE userId = ? AND slot = ?',
            userId,
            slot
        );
    }

    public async createCharacter(character: Character): Promise<void> {
        if (!this.db) throw new Error('Datenbank nicht initialisiert');

        await this.db.run(
            'INSERT INTO characters (userId, gender, slot) VALUES (?, ?, ?)',
            character.userId,
            character.gender,
            character.slot
        );
    }

    public async deleteCharacter(userId: number, slot: number): Promise<void> {
        if (!this.db) throw new Error('Datenbank nicht initialisiert');

        await this.db.run(
            'DELETE FROM characters WHERE userId = ? AND slot = ?',
            userId,
            slot
        );
    }

    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
} 