import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { Database } from './database';
import characterRoutes from './api/characters';

interface Player {
    id: number;
    name: string;
    gender: 'male' | 'female';
    position: {
        x: number;
        y: number;
        z: number;
    };
}

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server);
const db = Database.getInstance();
const players = new Map<number, Player>();

// Middleware
app.use(express.json());

// Statische Dateien
app.use(express.static(path.join(__dirname, '../client')));
app.use('/dist', express.static(path.join(__dirname, '../../dist')));

// API-Routen
app.use('/api', characterRoutes);

// Client-Routen
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/game', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/character', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Fallback für alle anderen Routen
app.get('*', (_req, res) => {
    res.redirect('/');
});

// Socket.IO Events
io.on('connection', (socket) => {
    console.log('Neuer Spieler verbunden');

    socket.on('player:join', (data: { id: number; name: string; gender: 'male' | 'female' }) => {
        const player: Player = {
            id: data.id,
            name: data.name,
            gender: data.gender,
            position: { x: 0, y: 0, z: 0 }
        };

        players.set(data.id, player);
        socket.broadcast.emit('player:joined', player);
        
        // Sende Liste aller aktiven Spieler an den neuen Spieler
        const activePlayers = Array.from(players.values());
        socket.emit('players:list', activePlayers);
        
        console.log(`Spieler ${data.name} (ID: ${data.id}) ist beigetreten`);
    });

    socket.on('player:move', (data: { id: number; position: { x: number; y: number; z: number } }) => {
        const player = players.get(data.id);
        if (player) {
            player.position = data.position;
            socket.broadcast.emit('player:moved', {
                id: data.id,
                position: data.position
            });
        }
    });

    socket.on('player:leave', (id: number) => {
        if (players.has(id)) {
            const player = players.get(id)!;
            players.delete(id);
            socket.broadcast.emit('player:left', id);
            console.log(`Spieler ${player.name} (ID: ${id}) hat das Spiel verlassen`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Spieler getrennt');
    });
});

// Server starten
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await db.initialize();
        
        server.listen(PORT, () => {
            console.log(`Server läuft auf Port ${PORT}`);
            console.log(`Client verfügbar unter: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Fehler beim Serverstart:', error);
        process.exit(1);
    }
}

startServer(); 