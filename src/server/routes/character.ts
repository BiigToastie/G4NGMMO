import { Router } from 'express';
import { Character } from '../../models/Character';

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
            res.json({
                hasCharacter: true,
                character: character
            });
        } else {
            res.json({
                hasCharacter: false
            });
        }
    } catch (error) {
        console.error('Fehler bei der Charakterprüfung:', error);
        res.status(500).json({ error: 'Serverfehler' });
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

        res.status(201).json(character);
    } catch (error) {
        console.error('Fehler beim Erstellen des Charakters:', error);
        res.status(500).json({ error: 'Serverfehler' });
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

        res.json(character);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Position:', error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

export default router; 