import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectToDatabase } from './mongodb';
import characterRoutes from './routes/character';
import { port } from './config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien
app.use(express.static('public'));

// API-Routen
app.use('/api/character', characterRoutes);

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

        // Starte Express-Server
        app.listen(port, () => {
            console.log(`Server läuft auf Port ${port}`);
        });
    } catch (error) {
        console.error('Serverfehler:', error);
        process.exit(1);
    }
}

startServer(); 