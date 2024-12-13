import express from 'express';
import { Database } from '../database';

const router = express.Router();
const db = Database.getInstance();

interface Character {
    userId: number;
    gender: 'male' | 'female';
    slot: number;
}

// Hole alle Charaktere eines Spielers
router.get('/characters/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const characters = await db.getCharacters(userId);
        res.json(characters);
    } catch (error) {
        console.error('Fehler beim Laden der Charaktere:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Hole einen spezifischen Charakter
router.get('/character/:userId/:slot', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const slot = parseInt(req.params.slot);
        const character = await db.getCharacter(userId, slot);
        
        if (!character) {
            res.status(404).json({ error: 'Charakter nicht gefunden' });
            return;
        }
        
        res.json(character);
    } catch (error) {
        console.error('Fehler beim Laden des Charakters:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Erstelle einen neuen Charakter
router.post('/character/create', async (req, res) => {
    try {
        const character: Character = req.body;
        
        // Überprüfe, ob der Slot bereits belegt ist
        const existingCharacter = await db.getCharacter(character.userId, character.slot);
        if (existingCharacter) {
            res.status(400).json({ error: 'Slot bereits belegt' });
            return;
        }
        
        // Überprüfe, ob der Spieler bereits die maximale Anzahl an Charakteren hat
        const characters = await db.getCharacters(character.userId);
        if (characters.length >= 2) {
            res.status(400).json({ error: 'Maximale Anzahl an Charakteren erreicht' });
            return;
        }
        
        await db.createCharacter(character);
        res.status(201).json({ message: 'Charakter erfolgreich erstellt' });
    } catch (error) {
        console.error('Fehler beim Erstellen des Charakters:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Lösche einen Charakter
router.delete('/character/:userId/:slot', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const slot = parseInt(req.params.slot);
        
        const character = await db.getCharacter(userId, slot);
        if (!character) {
            res.status(404).json({ error: 'Charakter nicht gefunden' });
            return;
        }
        
        await db.deleteCharacter(userId, slot);
        res.json({ message: 'Charakter erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Charakters:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

export default router; 