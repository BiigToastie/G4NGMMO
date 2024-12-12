import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectToDatabase } from './mongodb';
import characterRoutes from './routes/character';
import { port, env, telegramToken } from './config';
import BotHandler from './bot/TelegramBot';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien
app.use(express.static('public'));

// API-Routen
app.use('/api/character', characterRoutes);

// Webhook für Telegram Bot
app.post(`/bot${telegramToken}`, async (req, res) => {
    try {
        await BotHandler.getInstance().processUpdate(req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error('Fehler beim Verarbeiten des Webhook-Updates:', error);
        res.sendStatus(500);
    }
});

// Alle anderen Routen zur index.html umleiten (für Client-Side Routing)
app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/index.html'));
});

// Starte Server
async function startServer() {
    try {
        // Verbinde mit MongoDB
        await connectToDatabase();
        console.log('MongoDB-Verbindung hergestellt');

        // Initialisiere Bot im Produktionsmodus
        if (env === 'production') {
            BotHandler.getInstance();
            console.log('Telegram Bot initialisiert');
        }

        // Starte Express-Server
        app.listen(port, () => {
            console.log(`Server läuft auf Port ${port}`);
            console.log(`Webhook URL: ${process.env.BASE_URL}/bot${telegramToken}`);
        });
    } catch (error) {
        console.error('Serverfehler:', error);
        process.exit(1);
    }
}

// Error Handler
process.on('unhandledRejection', (error) => {
    console.error('Unbehandelter Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Unbehandelter Fehler:', error);
    process.exit(1);
});

startServer(); 