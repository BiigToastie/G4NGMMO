import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import type { ConnectOptions } from 'mongoose';
import characterRoutes from './routes/character';

// Umgebungsvariablen laden
dotenv.config();

// MongoDB Verbindung mit Retry-Logik
async function connectToMongoDB() {
    const maxRetries = 5;
    let retries = 0;

    // IP-Adresse des Servers ausgeben
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json() as { ip: string };
        console.log('Server IP-Adresse:', data.ip);
        console.log('WICHTIG: Diese IP-Adresse muss in der MongoDB Atlas IP-Whitelist hinzugefügt werden!');
    } catch (error) {
        console.error('Fehler beim Abrufen der IP-Adresse:', error);
    }

    while (retries < maxRetries) {
        try {
            // Konstruiere MongoDB Atlas URI
            const username = process.env.MONGODB_USERNAME || 'biigtoastie';
            const password = process.env.MONGODB_PASSWORD || 'OPbz9d7rIMed6tOi';
            const database = process.env.MONGODB_DATABASE || 'mmo-game';
            
            // DNS-Tests
            try {
                const { promisify } = require('util');
                const dns = require('dns');
                const resolveSrv = promisify(dns.resolveSrv);

                // Test SRV Record
                const srvRecords = await resolveSrv('_mongodb._tcp.cluster0.ktz7i.mongodb.net');
                console.log('MongoDB SRV Records:', srvRecords);

                // Konstruiere URI basierend auf SRV-Records
                const hosts = srvRecords
                    .map(record => `${record.name}:${record.port}`)
                    .join(',');

                const mongoUri = `mongodb://${username}:${password}@${hosts}/${database}?replicaSet=atlas-wi4lzq-shard-0&tls=true&authSource=admin`;
                console.log('Versuche Verbindung mit MongoDB:', mongoUri.replace(/:[^:]*@/, ':****@'));

                const mongooseOptions = {
                    serverSelectionTimeoutMS: 60000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 60000,
                    heartbeatFrequencyMS: 10000,
                    retryWrites: true,
                    retryReads: true,
                    w: 'majority',
                    maxPoolSize: 10,
                    minPoolSize: 5,
                    authSource: 'admin',
                    family: 4,
                    serverApi: {
                        version: '1',
                        strict: true,
                        deprecationErrors: true
                    }
                } satisfies ConnectOptions;

                await mongoose.connect(mongoUri, mongooseOptions);
                console.log('Mit MongoDB verbunden');
                return true;

            } catch (error) {
                retries++;
                if (error instanceof Error) {
                    console.error(`MongoDB Verbindungsversuch ${retries}/${maxRetries} fehlgeschlagen:`, error.message);
                } else {
                    console.error(`MongoDB Verbindungsversuch ${retries}/${maxRetries} fehlgeschlagen:`, error);
                }

                if (retries === maxRetries) {
                    console.error('Maximale Anzahl an Verbindungsversuchen erreicht');
                    return false;
                }

                const backoffTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                console.log(`Warte ${Math.round(backoffTime/1000)} Sekunden vor dem nächsten Versuch...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        } catch (error) {
            retries++;
            console.error(`MongoDB Verbindungsversuch ${retries}/${maxRetries} fehlgeschlagen:`, error);
            
            // Detailliertere Fehleranalyse
            const mongoError = error as any;
            if (mongoError.name === 'MongoServerSelectionError') {
                console.error('Server Selection Details:', {
                    type: mongoError.reason?.type,
                    setName: mongoError.reason?.setName,
                    servers: mongoError.reason?.servers ? 
                        Array.from(mongoError.reason.servers.entries() as IterableIterator<[string, any]>)
                            .map(([host, desc]) => ({
                                host,
                                type: desc.type,
                                error: desc.error?.message,
                                state: desc.state
                            })) : []
                });
            }

            if (retries === maxRetries) {
                console.error('Maximale Anzahl an Verbindungsversuchen erreicht');
                return false;
            }
            
            const backoffTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            console.log(`Warte ${Math.round(backoffTime/1000)} Sekunden vor dem nächsten Versuch...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
    }
    return false;
}

// Express Server
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Statische Dateien

// Routen
app.use('/api/character', characterRoutes);

// Basis-Route für Gesundheitscheck
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'G4NG MMO API läuft' });
});

// Game-Route für die Web-App
app.get('/game', (req, res) => {
    res.sendFile('public/index.html', { root: '.' });
});

// Bot-Instanz und Status
class BotManager {
    private static instance: BotManager;
    private bot: TelegramBot | null = null;
    private isInitializing: boolean = false;
    private shutdownRequested: boolean = false;
    private lastInitAttempt: number = 0;
    private readonly MIN_INIT_INTERVAL = 15000; // 15 Sekunden
    private cleanupTimeout: NodeJS.Timeout | null = null;

    private constructor() {}

    public static getInstance(): BotManager {
        if (!BotManager.instance) {
            BotManager.instance = new BotManager();
        }
        return BotManager.instance;
    }

    private async cleanup() {
        if (this.bot) {
            try {
                await this.bot.stopPolling();
                await new Promise(resolve => setTimeout(resolve, 5000));
                this.bot = null;
            } catch (error) {
                console.error('Fehler beim Cleanup:', error);
            }
        }
    }

    public async initialize() {
        const now = Date.now();
        if (this.isInitializing || this.shutdownRequested || (now - this.lastInitAttempt < this.MIN_INIT_INTERVAL)) {
            return;
        }

        try {
            this.isInitializing = true;
            this.lastInitAttempt = now;

            await this.cleanup();

            this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
                polling: {
                    interval: 3000,
                    autoStart: true,
                    params: {
                        timeout: 30,
                        allowed_updates: ['message', 'callback_query'],
                        limit: 100
                    }
                },
                filepath: false
            });

            this.bot.on('polling_error', async (error: Error) => {
                const telegramError = error as any;
                if (telegramError.code === 'ETELEGRAM' && telegramError.message.includes('terminated by other getUpdates')) {
                    console.log('Bot-Instanz wurde durch eine andere ersetzt. Starte Cleanup...');
                    
                    if (this.cleanupTimeout) {
                        clearTimeout(this.cleanupTimeout);
                    }
                    
                    this.cleanupTimeout = setTimeout(async () => {
                        this.isInitializing = false;
                        if (!this.shutdownRequested) {
                            await this.initialize();
                        }
                    }, 15000);
                    
                    return;
                }
                console.error('Polling-Fehler:', error);
            });

            // Bot-Befehle
            this.bot.onText(/\/start/, async (msg) => {
                const chatId = msg.chat.id;
                const userId = msg.from?.id.toString();

                if (!userId) {
                    console.error('Start-Befehl: Keine Benutzer-ID gefunden');
                    this.bot?.sendMessage(chatId, 'Fehler: Benutzer-ID nicht gefunden');
                    return;
                }

                try {
                    if (!process.env.BASE_URL) {
                        throw new Error('BASE_URL ist nicht definiert');
                    }

                    console.log(`Prüfe Charakter für Benutzer ${userId}`);
                    
                    // Prüfen, ob bereits ein Charakter existiert
                    const characterUrl = new URL(`/api/character/${userId}`, process.env.BASE_URL).toString();
                    console.log('Character URL:', characterUrl);
                    
                    const response = await fetch(characterUrl);
                    console.log('API Response Status:', response.status);
                    
                    if (response.ok) {
                        // Charakter existiert bereits
                        console.log(`Existierender Charakter gefunden für Benutzer ${userId}`);
                        this.bot?.sendMessage(chatId, 'Willkommen zurück! Dein Charakter ist bereits erstellt.');
                    } else {
                        // Neuer Spieler - Charaktererstellung starten
                        console.log(`Kein Charakter gefunden für Benutzer ${userId}, starte Erstellung`);
                        const gameUrl = new URL('/game', process.env.BASE_URL).toString();
                        console.log('Game URL:', gameUrl);
                        
                        this.bot?.sendMessage(chatId, 
                            'Willkommen bei G4NG MMO! Lass uns deinen Charakter erstellen.',
                            {
                                reply_markup: {
                                    inline_keyboard: [[
                                        {
                                            text: 'Charakter erstellen',
                                            web_app: { url: gameUrl }
                                        }
                                    ]]
                                }
                            }
                        );
                    }
                } catch (error) {
                    console.error('Fehler beim Prüfen des Charakters:', error);
                    this.bot?.sendMessage(chatId, 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
                }
            });

            // Rest der Bot-Konfiguration...

            console.log('Bot erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler beim Initialisieren des Bots:', error);
            this.isInitializing = false;
            if (!this.shutdownRequested) {
                setTimeout(() => this.initialize(), 15000);
            }
        } finally {
            this.isInitializing = false;
        }
    }

    public async shutdown() {
        this.shutdownRequested = true;
        if (this.cleanupTimeout) {
            clearTimeout(this.cleanupTimeout);
        }
        await this.cleanup();
    }
}

// Server starten und Initialisierung
async function startServer() {
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
        console.error('Konnte keine Verbindung zu MongoDB herstellen. Server wird nicht gestartet.');
        process.exit(1);
    }

    const botManager = BotManager.getInstance();

    const port = parseInt(process.env.PORT || '3000', 10);
    console.log('Starte Server auf Port:', port);

    app.listen(port, '0.0.0.0', () => {
        console.log(`Server läuft auf Port ${port}`);
        botManager.initialize();
    });

    // Prozess-Beendigung behandeln
    process.on('SIGTERM', async () => {
        console.log('SIGTERM Signal empfangen. Beende Bot...');
        await botManager.shutdown();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT Signal empfangen. Beende Bot...');
        await botManager.shutdown();
        process.exit(0);
    });
}

startServer(); 