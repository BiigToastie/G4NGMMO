import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { GameWorld } from './game/GameWorld';

interface CharacterData {
    userId: number;
    gender: 'male' | 'female';
    slot: number;
}

interface SavedCharacter {
    gender: 'male' | 'female';
    slot: number;
}

let characterCreator: CharacterCreator;
let gameWorld: GameWorld;
let selectedSlot: number | null = null;
let selectedCharacter: SavedCharacter | null = null;

async function initializeApp(): Promise<void> {
    try {
        console.log('App-Initialisierung startet...');
        await WebApp.ready();
        console.log('WebApp ist bereit');

        await loadSavedCharacters();
        setupEventListeners();

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        showError('Fehler beim Laden des Spiels');
    }
}

async function loadSavedCharacters(): Promise<void> {
    try {
        if (!WebApp.initDataUnsafe.user?.id) {
            throw new Error('Keine Benutzer-ID gefunden');
        }

        const response = await fetch(`/api/characters/${WebApp.initDataUnsafe.user.id}`);
        if (!response.ok) throw new Error('Fehler beim Laden der Charaktere');

        const characters: SavedCharacter[] = await response.json();
        updateCharacterSlots(characters);
    } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Charaktere:', error);
        showError('Fehler beim Laden der Charaktere');
    }
}

function updateCharacterSlots(characters: SavedCharacter[]): void {
    const slots = document.querySelectorAll('.character-slot');
    slots.forEach((slot: Element) => {
        const slotNumber = parseInt((slot as HTMLElement).dataset.slot || '0');
        const character = characters.find(char => char.slot === slotNumber);

        if (character) {
            slot.innerHTML = `
                <div class="character-info">
                    <p>${character.gender === 'male' ? 'Männlich' : 'Weiblich'}</p>
                </div>
            `;
        } else {
            slot.innerHTML = '<p class="empty-slot-text">Leerer Slot</p>';
        }
    });
}

function setupEventListeners(): void {
    setupCharacterSlots();
    setupCreatorButtons();
    setupGameStartButton();
}

function setupCharacterSlots(): void {
    const slots = document.querySelectorAll('.character-slot');
    slots.forEach((slot: Element) => {
        slot.addEventListener('click', () => {
            const slotNumber = parseInt((slot as HTMLElement).dataset.slot || '0');
            handleSlotClick(slotNumber, slot as HTMLElement);
        });
    });
}

async function handleSlotClick(slotNumber: number, slotElement: HTMLElement): Promise<void> {
    const isEmptySlot = slotElement.querySelector('.empty-slot-text') !== null;

    if (!WebApp.initDataUnsafe.user?.id) {
        showError('Keine Benutzer-ID gefunden');
        return;
    }

    if (isEmptySlot) {
        selectedSlot = slotNumber;
        showCharacterCreator();
    } else {
        const response = await fetch(`/api/character/${WebApp.initDataUnsafe.user.id}/${slotNumber}`);
        if (!response.ok) {
            showError('Fehler beim Laden des Charakters');
            return;
        }

        selectedCharacter = await response.json();
        document.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
        slotElement.classList.add('selected');
        document.getElementById('start-game')?.removeAttribute('disabled');
    }
}

function setupCreatorButtons(): void {
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    const saveBtn = document.getElementById('save-character');
    const cancelBtn = document.getElementById('cancel-creation');

    if (!maleBtn || !femaleBtn || !saveBtn || !cancelBtn) {
        console.error('Charakter-Editor Buttons nicht gefunden');
        return;
    }

    maleBtn.addEventListener('click', () => handleGenderSelection('male', maleBtn, femaleBtn));
    femaleBtn.addEventListener('click', () => handleGenderSelection('female', femaleBtn, maleBtn));
    saveBtn.addEventListener('click', handleSaveCharacter);
    cancelBtn.addEventListener('click', hideCharacterCreator);
}

function setupGameStartButton(): void {
    const startBtn = document.getElementById('start-game');
    if (!startBtn) return;

    startBtn.addEventListener('click', startGame);
}

async function handleGenderSelection(gender: 'male' | 'female', activeBtn: HTMLElement, inactiveBtn: HTMLElement): Promise<void> {
    try {
        activeBtn.classList.add('selected');
        inactiveBtn.classList.remove('selected');
        
        if (!characterCreator) {
            characterCreator = CharacterCreator.getInstance();
            await characterCreator.initialize();
        }
        
        characterCreator.setGender(gender);
    } catch (error) {
        console.error('Fehler bei der Geschlechterauswahl:', error);
        showError('Fehler beim Laden des Charakters');
    }
}

async function handleSaveCharacter(): Promise<void> {
    if (selectedSlot === null) {
        showError('Kein Slot ausgewählt');
        return;
    }

    if (!WebApp.initDataUnsafe.user?.id) {
        showError('Keine Benutzer-ID gefunden');
        return;
    }

    try {
        const gender = document.getElementById('male-btn')?.classList.contains('selected') ? 'male' : 'female';
        
        const characterData: CharacterData = {
            userId: WebApp.initDataUnsafe.user.id,
            gender,
            slot: selectedSlot
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

        await loadSavedCharacters();
        hideCharacterCreator();
        selectedSlot = null;

    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showError('Fehler beim Speichern des Charakters');
    }
}

async function startGame(): Promise<void> {
    if (!selectedCharacter) {
        showError('Kein Charakter ausgewählt');
        return;
    }

    if (!WebApp.initDataUnsafe.user?.id) {
        showError('Keine Benutzer-ID gefunden');
        return;
    }

    try {
        document.getElementById('character-selection')!.style.display = 'none';
        const gameWorldElement = document.getElementById('game-world')!;
        gameWorldElement.style.display = 'block';

        gameWorld = GameWorld.getInstance();
        await gameWorld.initialize();

        await gameWorld.addPlayer(
            WebApp.initDataUnsafe.user.id,
            WebApp.initDataUnsafe.user.username || 'Spieler',
            selectedCharacter.gender
        );

        // TODO: Verbinde mit dem Spiel-Server und lade andere Spieler
        
    } catch (error) {
        console.error('Fehler beim Spielstart:', error);
        showError('Fehler beim Starten des Spiels');
    }
}

function showCharacterCreator(): void {
    document.getElementById('character-selection')!.style.display = 'none';
    document.getElementById('character-creator')!.style.display = 'block';
}

function hideCharacterCreator(): void {
    document.getElementById('character-creator')!.style.display = 'none';
    document.getElementById('character-selection')!.style.display = 'flex';
}

function showError(message: string): void {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);

    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 