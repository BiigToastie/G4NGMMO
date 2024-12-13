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

// MIME-Types für GLB/GLTF
express.static.mime.define({
    'model/gltf-binary': ['glb'],
    'model/gltf+json': ['gltf']
});

// Statische Dateien mit spezifischen Optionen
app.use(express.static('public', {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.glb')) {
            res.setHeader('Content-Type', 'model/gltf-binary');
        }
        if (path.endsWith('.gltf')) {
            res.setHeader('Content-Type', 'model/gltf+json');
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }
}));

// Debug-Route für Modell-Verzeichnis
app.get('/debug/models', (_req, res) => {
    const modelsPath = path.join(__dirname, '../../public/models');
    const fs = require('fs');
    try {
        const files = fs.readdirSync(modelsPath, { recursive: true });
        res.json({
            success: true,
            path: modelsPath,
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: String(error)
        });
    }
});

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
            console.log(`Öffentliches Verzeichnis: ${path.resolve(__dirname, '../../public')}`);
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