import { MongoClient, Db, Collection, Document } from 'mongodb';
import { mongoUri, dbName, debug } from './config';

interface DatabaseConnection {
    client: MongoClient;
    db: Db;
}

let connection: DatabaseConnection | null = null;

export async function connectToDatabase(): Promise<DatabaseConnection> {
    if (connection) return connection;

    try {
        if (debug) {
            console.log('Verbinde mit MongoDB...', { uri: mongoUri, database: dbName });
        }

        const client = await MongoClient.connect(mongoUri, {
            connectTimeoutMS: 10000, // 10 Sekunden Timeout
            socketTimeoutMS: 45000,  // 45 Sekunden Timeout
        });

        const db = client.db(dbName);

        // Test die Verbindung
        await db.command({ ping: 1 });

        connection = { client, db };
        console.log('Erfolgreich mit MongoDB verbunden.');
        
        return connection;
    } catch (error) {
        console.error('Fehler bei der MongoDB-Verbindung:', error);
        throw new Error(`MongoDB Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
    if (!connection) {
        await connectToDatabase();
    }
    return connection!.db.collection<T>(collectionName);
}

export async function closeConnection(): Promise<void> {
    if (connection) {
        try {
            await connection.client.close();
            connection = null;
            console.log('MongoDB-Verbindung geschlossen.');
        } catch (error) {
            console.error('Fehler beim Schließen der MongoDB-Verbindung:', error);
            throw error;
        }
    }
}

// Error Handler
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

// Unerwartete Fehler
process.on('unhandledRejection', (reason) => {
    console.error('Unbehandelter Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Unbehandelter Fehler:', error);
    closeConnection().finally(() => process.exit(1));
}); 