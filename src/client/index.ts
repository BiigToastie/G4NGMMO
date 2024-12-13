import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';

type CharacterClass = 'warrior' | 'mage' | 'ranger' | 'rogue';
type CharacterGender = 'male' | 'female';

let characterCreator: CharacterCreator;

async function initializeApp(): Promise<void> {
    try {
        console.log('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await WebApp.ready();
        console.log('WebApp ist bereit');

        // Initialisiere CharacterCreator
        characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        // Lade initiales männliches Modell
        await characterCreator.updateCharacter('male');
        console.log('Initiales Modell geladen');

        setupEventListeners();

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        showError('Fehler beim Laden des Spiels');
    }
}

function setupEventListeners(): void {
    // Event-Listener für Geschlechterauswahl
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');

    if (!maleBtn || !femaleBtn) {
        console.error('Geschlechter-Buttons nicht gefunden');
        return;
    }

    maleBtn.addEventListener('click', async () => {
        try {
            maleBtn.classList.add('selected');
            femaleBtn.classList.remove('selected');
            characterCreator.setGender('male');
        } catch (error) {
            console.error('Fehler beim Laden des männlichen Charakters:', error);
            showError('Fehler beim Laden des Charakters');
        }
    });

    femaleBtn.addEventListener('click', async () => {
        try {
            femaleBtn.classList.add('selected');
            maleBtn.classList.remove('selected');
            characterCreator.setGender('female');
        } catch (error) {
            console.error('Fehler beim Laden des weiblichen Charakters:', error);
            showError('Fehler beim Laden des Charakters');
        }
    });

    // Event-Listener für Klassen-Buttons
    const classButtons = ['warrior', 'mage', 'ranger', 'rogue'].map(className => ({
        id: className,
        element: document.getElementById(`${className}-btn`)
    }));

    classButtons.forEach(({ id, element }) => {
        if (!element) {
            console.error(`Button für Klasse ${id} nicht gefunden`);
            return;
        }

        element.addEventListener('click', () => {
            classButtons.forEach(btn => btn.element?.classList.remove('selected'));
            element.classList.add('selected');
        });
    });

    // Event-Listener für Speichern-Button
    const saveBtn = document.getElementById('save-character');
    if (!saveBtn) {
        console.error('Speichern-Button nicht gefunden');
        return;
    }

    saveBtn.addEventListener('click', handleSaveCharacter);
}

async function handleSaveCharacter(): Promise<void> {
    try {
        const selectedGender = getSelectedGender();
        const selectedClass = getSelectedClass();

        if (!WebApp.initDataUnsafe.user?.id) {
            throw new Error('Keine Benutzer-ID gefunden');
        }

        const response = await fetch('/api/character/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: WebApp.initDataUnsafe.user.id,
                gender: selectedGender,
                class: selectedClass
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Charakters');
        }

        WebApp.close();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showError('Fehler beim Speichern des Charakters');
    }
}

function getSelectedGender(): CharacterGender {
    const maleBtn = document.getElementById('male-btn');
    return maleBtn?.classList.contains('selected') ? 'male' : 'female';
}

function getSelectedClass(): CharacterClass {
    const classes: CharacterClass[] = ['warrior', 'mage', 'ranger', 'rogue'];
    return classes.find(className => 
        document.getElementById(`${className}-btn`)?.classList.contains('selected')
    ) || 'warrior';
}

function showError(message: string): void {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) {
        console.error('Error-Element nicht gefunden');
        return;
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

// Starte die App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 