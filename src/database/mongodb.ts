import mongoose from 'mongoose';
import { networkInterfaces } from 'os';

// Funktion zum Abrufen der Server-IP
async function getServerIp(): Promise<string> {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (!net.internal && net.family === 'IPv4') {
                return net.address;
            }
        }
    }
    throw new Error('Keine externe IPv4-Adresse gefunden');
}

export async function connectToMongoDB(): Promise<boolean> {
    const maxRetries = 5;
    let currentRetry = 0;
    
    // Hole Server IP-Adresse
    try {
        const serverIp = await getServerIp();
        console.log(`Server IP-Adresse: ${serverIp}`);
        console.log('WICHTIG: Diese IP-Adresse muss in der MongoDB Atlas IP-Whitelist hinzugefügt werden!');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fehler beim Abrufen der Server-IP:', error.message);
        }
    }

    while (currentRetry < maxRetries) {
        try {
            const uri = process.env.MONGODB_URI;
            if (!uri) {
                throw new Error('MONGODB_URI ist nicht definiert');
            }

            console.log('Versuche Verbindung mit MongoDB...');
            console.log('Debug: mongoose.connection.readyState:', mongoose.connection.readyState);

            // Wenn bereits eine Verbindung besteht, diese schließen
            if (mongoose.connection.readyState !== 0) {
                console.log('Schließe bestehende Verbindung...');
                await mongoose.connection.close();
            }

            // Vereinfachte Verbindungsoptionen für clickercluster
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
                maxPoolSize: 10,
                retryWrites: true,
                retryReads: true,
                ssl: true,
                tls: true
            });

            // Prüfe Verbindungsstatus
            const isConnected = mongoose.connection.readyState === 1;
            if (isConnected) {
                console.log('Erfolgreich mit MongoDB verbunden!');
                console.log('Verbindungsdetails:', {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name,
                    readyState: mongoose.connection.readyState
                });
                return true;
            } else {
                throw new Error('Verbindung nicht hergestellt');
            }

        } catch (error) {
            currentRetry++;
            if (error instanceof Error) {
                console.error(`MongoDB Verbindungsversuch ${currentRetry}/${maxRetries} fehlgeschlagen:`, {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
            
            if (currentRetry < maxRetries) {
                const waitTime = Math.pow(2, currentRetry) * 1000;
                console.log(`Warte ${waitTime/1000} Sekunden vor dem nächsten Versuch...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.log('Maximale Anzahl an Verbindungsversuchen erreicht');
    return false;
} 