import { Router, Request, Response } from 'express';
import { Character, ICharacter } from '../models/character';

const router = Router();

// Charakter erstellen
router.post('/', async (req: Request<any, any, { userId: number; character: any }>, res: Response) => {
    try {
        const { userId, character } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
        }

        // Prüfen, ob bereits ein Charakter existiert
        const existingCharacter = await Character.findOne({ userId });
        if (existingCharacter) {
            return res.status(400).json({ error: 'Es existiert bereits ein Charakter für diesen Benutzer' });
        }

        // Validierung der Charakterdaten
        if (!character.name || !character.gender) {
            return res.status(400).json({ error: 'Name und Geschlecht sind erforderlich' });
        }

        // Neuen Charakter erstellen
        const newCharacter = new Character({
            userId,
            name: character.name,
            gender: character.gender,
            height: character.height,
            build: character.build,
            skinColor: character.skinColor,
            face: character.face,
            hairColor: character.hairColor,
            hairStyle: character.hairStyle,
            eyes: character.eyes,
            eyeColor: character.eyeColor,
            mouth: character.mouth
        });

        await newCharacter.save();
        res.status(201).json(newCharacter);
    } catch (error) {
        console.error('Fehler beim Erstellen des Charakters:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// Charakter abrufen
router.get('/:userId', async (req: Request<{ userId: string }>, res: Response) => {
    try {
        const { userId } = req.params;
        const character = await Character.findOne({ userId: parseInt(userId) });

        if (!character) {
            return res.status(404).json({ error: 'Charakter nicht gefunden' });
        }

        res.status(200).json(character);
    } catch (error) {
        console.error('Fehler beim Abrufen des Charakters:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// Charakter aktualisieren
router.put('/:userId', async (req: Request<{ userId: string }, any, Partial<ICharacter>>, res: Response) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const character = await Character.findOneAndUpdate(
            { userId: parseInt(userId) },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!character) {
            return res.status(404).json({ error: 'Charakter nicht gefunden' });
        }

        res.status(200).json(character);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Charakters:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// Charakter löschen
router.delete('/:userId', async (req: Request<{ userId: string }>, res: Response) => {
    try {
        const { userId } = req.params;
        const character = await Character.findOneAndDelete({ userId: parseInt(userId) });

        if (!character) {
            return res.status(404).json({ error: 'Charakter nicht gefunden' });
        }

        res.status(200).json({ message: 'Charakter erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Charakters:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

export default router; 