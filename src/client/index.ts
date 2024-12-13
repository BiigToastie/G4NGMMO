import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';

interface CharacterSelection {
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

const selectedCharacter: CharacterSelection = {
    gender: 'male',
    class: 'warrior'
};

function updateButtonStates() {
    // Geschlecht-Buttons
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    if (maleBtn && femaleBtn) {
        maleBtn.classList.toggle('selected', selectedCharacter.gender === 'male');
        femaleBtn.classList.toggle('selected', selectedCharacter.gender === 'female');
    }

    // Klassen-Buttons
    const classButtons = ['warrior', 'mage', 'ranger', 'rogue'].map(c => 
        document.getElementById(`${c}-btn`)
    );
    classButtons.forEach(btn => {
        if (btn) {
            btn.classList.toggle('selected', 
                selectedCharacter.class === btn.id.replace('-btn', '')
            );
        }
    });
}

function setupEventListeners() {
    // Geschlecht-Auswahl
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    
    maleBtn?.addEventListener('click', () => {
        selectedCharacter.gender = 'male';
        updateButtonStates();
        updateCharacterPreview();
    });
    
    femaleBtn?.addEventListener('click', () => {
        selectedCharacter.gender = 'female';
        updateButtonStates();
        updateCharacterPreview();
    });

    // Klassen-Auswahl
    ['warrior', 'mage', 'ranger', 'rogue'].forEach(className => {
        const btn = document.getElementById(`${className}-btn`);
        btn?.addEventListener('click', () => {
            selectedCharacter.class = className as CharacterSelection['class'];
            updateButtonStates();
            updateCharacterPreview();
        });
    });

    // Speichern-Button
    const saveBtn = document.getElementById('save-character');
    saveBtn?.addEventListener('click', async () => {
        try {
            await saveCharacter();
            WebApp.close();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = 'Fehler beim Speichern des Charakters. Bitte versuchen Sie es erneut.';
                errorElement.style.display = 'block';
            }
        }
    });
}

async function updateCharacterPreview() {
    const characterCreator = CharacterCreator.getInstance();
    await characterCreator.updateCharacter(selectedCharacter.gender, selectedCharacter.class);
}

async function saveCharacter() {
    const response = await fetch('/api/character/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: WebApp.initDataUnsafe.user?.id,
            gender: selectedCharacter.gender,
            class: selectedCharacter.class
        })
    });

    if (!response.ok) {
        throw new Error('Fehler beim Speichern des Charakters');
    }

    return await response.json();
}

async function initializeApp() {
    try {
        console.log('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await WebApp.ready();
        console.log('WebApp ist bereit');

        // Zeige direkt die Charakterauswahl
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.style.display = 'grid';
        }

        // Initialisiere CharacterCreator
        const characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        // Initialisiere Event Listener
        setupEventListeners();
        
        // Zeige initiale Charaktervorschau
        await updateCharacterPreview();

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Fehler beim Laden des Spiels. Bitte versuchen Sie es erneut.';
            errorElement.style.display = 'block';
        }
    }
}

// Starte die App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 