import { Router } from 'express';
import { Character } from '../models/Character';

const router = Router();

// Prüfe ob Spieler bereits einen Charakter hat
router.get('/check', async (req, res) => {
    try {
        const userId = req.headers['user-id']; // Von Telegram WebApp
        if (!userId) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }

        const character = await Character.findOne({ userId });
        
        if (character) {
            return res.json({
                hasCharacter: true,
                character: character
            });
        } else {
            return res.json({
                hasCharacter: false
            });
        }
    } catch (error) {
        console.error('Fehler bei der Charakterprüfung:', error);
        return res.status(500).json({ error: 'Serverfehler' });
    }
});

// Erstelle neuen Charakter
router.post('/', async (req, res) => {
    try {
        const userId = req.headers['user-id']; // Von Telegram WebApp
        if (!userId) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }

        // Prüfe ob bereits ein Charakter existiert
        const existingCharacter = await Character.findOne({ userId });
        if (existingCharacter) {
            return res.status(400).json({ error: 'Charakter existiert bereits' });
        }

        // Erstelle neuen Charakter
        const characterData = {
            ...req.body,
            userId,
            createdAt: new Date(),
            lastLogin: new Date()
        };

        const character = new Character(characterData);
        await character.save();

        return res.status(201).json(character);
    } catch (error) {
        console.error('Fehler beim Erstellen des Charakters:', error);
        return res.status(500).json({ error: 'Serverfehler' });
    }
});

// Aktualisiere Charakterposition
router.put('/position', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }

        const { position, rotation } = req.body;
        const character = await Character.findOneAndUpdate(
            { userId },
            { 
                $set: { 
                    position,
                    rotation,
                    lastLogin: new Date()
                }
            },
            { new: true }
        );

        if (!character) {
            return res.status(404).json({ error: 'Charakter nicht gefunden' });
        }

        return res.json(character);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Position:', error);
        return res.status(500).json({ error: 'Serverfehler' });
    }
});

router.get('/debug/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const character = await Character.findOne({ userId });
        
        if (!character) {
            return res.status(404).json({ 
                error: 'Kein Charakter gefunden',
                userId 
            });
        }

        res.json({ 
            character,
            exists: true,
            dataComplete: Boolean(
                character.userId && 
                character.name && 
                character.class && 
                character.gender
            )
        });
    } catch (error) {
        console.error('Debug-Fehler:', error);
        res.status(500).json({ 
            error: 'Serverfehler beim Debug',
            message: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});

// Temporärer Debug-Endpunkt
router.get('/debug/all/characters', async (_req, res) => {
    try {
        const characters = await Character.find({});
        
        const debugInfo = {
            totalCharacters: characters.length,
            characters: characters.map(char => ({
                userId: char.userId,
                name: char.name,
                class: char.class,
                gender: char.gender,
                hasPosition: Boolean(char.position),
                hasRotation: Boolean(char.rotation),
                lastLogin: char.lastLogin,
                isComplete: Boolean(
                    char.userId && 
                    char.name && 
                    char.class && 
                    char.gender
                )
            }))
        };

        res.json(debugInfo);
    } catch (error) {
        console.error('Debug-Fehler:', error);
        res.status(500).json({ 
            error: 'Serverfehler beim Debug',
            message: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});

export default router; 