import express from 'express';
import cors from 'cors';
import { connectToMongoDB } from './database/mongodb';
import { BotManager } from './telegram/bot';
import characterRoutes from './routes/character';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routen
app.use('/api/character', characterRoutes);

// Basis-Route für Gesundheitscheck
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

// Character-Route
app.get('/character', (req, res) => {
    res.sendFile('character.html', { root: 'public' });
});

// Game-Route
app.get('/game', (req, res) => {
    res.sendFile('game.html', { root: 'public' });
});

// Fallback für alle anderen Routen
app.get('*', (req, res) => {
    res.redirect('/');
});

// Server starten und Initialisierung
async function startServer() {
    try {
        // Server starten
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Server läuft auf Port ${port}`);
        });

        // MongoDB-Verbindung versuchen
        const mongoConnected = await connectToMongoDB();
        if (!mongoConnected) {
            console.error('MongoDB-Verbindung fehlgeschlagen - Server läuft mit eingeschränkter Funktionalität');
        } else {
            console.log('MongoDB-Verbindung erfolgreich hergestellt');
        }

        // Bot initialisieren
        const botManager = BotManager.getInstance();
        botManager.initialize();

        // Graceful Shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM Signal empfangen. Beende Server...');
            await server.close();
            await botManager.shutdown();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT Signal empfangen. Beende Server...');
            await server.close();
            await botManager.shutdown();
            process.exit(0);
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Kritischer Fehler beim Serverstart:', error.message);
        }
        process.exit(1);
    }
}

// Server starten
startServer().catch(error => {
    console.error('Unbehandelter Fehler:', error);
    process.exit(1);
}); 