import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';

type CharacterClass = 'warrior' | 'mage' | 'ranger' | 'rogue';
type CharacterGender = 'male' | 'female';

interface CharacterData {
    userId: number;
    gender: CharacterGender;
    class: CharacterClass;
}

let characterCreator: CharacterCreator;

async function initializeApp(): Promise<void> {
    try {
        console.log('App-Initialisierung startet...');
        
        await WebApp.ready();
        console.log('WebApp ist bereit');

        characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        setupEventListeners();
    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        showError('Fehler beim Laden des Spiels');
    }
}

function setupEventListeners(): void {
    setupGenderButtons();
    setupClassButtons();
    setupSaveButton();
}

function setupGenderButtons(): void {
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');

    if (!maleBtn || !femaleBtn) {
        console.error('Geschlechter-Buttons nicht gefunden');
        return;
    }

    maleBtn.classList.add('selected');
    femaleBtn.classList.remove('selected');
    characterCreator.setGender('male');

    const handleGenderSelection = (gender: CharacterGender, activeBtn: HTMLElement, inactiveBtn: HTMLElement) => {
        try {
            activeBtn.classList.add('selected');
            inactiveBtn.classList.remove('selected');
            characterCreator.setGender(gender);
            console.log(`Geschlecht gewechselt zu: ${gender}`);
        } catch (error) {
            console.error(`Fehler beim Laden des ${gender} Charakters:`, error);
            showError('Fehler beim Laden des Charakters');
        }
    };

    maleBtn.addEventListener('click', () => handleGenderSelection('male', maleBtn, femaleBtn));
    femaleBtn.addEventListener('click', () => handleGenderSelection('female', femaleBtn, maleBtn));
}

function setupClassButtons(): void {
    const classes: CharacterClass[] = ['warrior', 'mage', 'ranger', 'rogue'];
    const classButtons = classes.map(className => ({
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
}

function setupSaveButton(): void {
    const saveBtn = document.getElementById('save-character');
    if (!saveBtn) {
        console.error('Speichern-Button nicht gefunden');
        return;
    }

    saveBtn.addEventListener('click', handleSaveCharacter);
}

async function handleSaveCharacter(): Promise<void> {
    try {
        if (!WebApp.initDataUnsafe.user?.id) {
            throw new Error('Keine Benutzer-ID gefunden');
        }

        const characterData: CharacterData = {
            userId: WebApp.initDataUnsafe.user.id,
            gender: getSelectedGender(),
            class: getSelectedClass()
        };

        const response = await fetch('/api/character/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(characterData)
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
    const selectedClass = classes.find(className => 
        document.getElementById(`${className}-btn`)?.classList.contains('selected')
    );
    return selectedClass ?? 'warrior';
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 