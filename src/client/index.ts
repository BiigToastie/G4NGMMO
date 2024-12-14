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

declare global {
    interface Window {
        logDebug: (message: string) => void;
    }
}

// Stellen Sie sicher, dass logDebug verfügbar ist
if (!window.logDebug) {
    window.logDebug = (message: string) => {
        console.log(message);
    };
}

async function waitForWebApp(): Promise<void> {
    window.logDebug('Warte auf WebApp...');
    try {
        await WebApp.ready();
        window.logDebug('WebApp ist bereit');
    } catch (error) {
        window.logDebug('Fehler beim Warten auf WebApp');
        throw error;
    }
}

async function initializeApp(): Promise<void> {
    try {
        window.logDebug('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await waitForWebApp();

        // Prüfe DOM-Elemente
        const elements = {
            characterSelection: document.getElementById('character-selection'),
            characterCreator: document.getElementById('character-creator'),
            gameWorld: document.getElementById('game-world'),
            loading: document.getElementById('loading')
        };

        // Überprüfe alle erforderlichen Elemente
        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                throw new Error(`Element ${name} nicht gefunden`);
            }
            window.logDebug(`Element ${name} gefunden`);
        });

        // Setze initiale Anzeige
        elements.characterSelection!.style.display = 'flex';
        elements.characterCreator!.style.display = 'none';
        elements.gameWorld!.style.display = 'none';

        // Lade Charaktere und richte Event-Listener ein
        window.logDebug('Lade gespeicherte Charaktere...');
        await loadSavedCharacters();
        
        window.logDebug('Richte Event-Listener ein...');
        setupEventListeners();

        // Verstecke Ladebildschirm
        if (elements.loading) {
            elements.loading.style.display = 'none';
        }

        window.logDebug('App-Initialisierung abgeschlossen');

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        window.logDebug(`Fehler: ${error instanceof Error ? error.message : String(error)}`);
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

    console.log('Event-Listener eingerichtet');
}

function setupCharacterSlots(): void {
    const slots = document.querySelectorAll('.character-slot');
    console.log('Gefundene Character-Slots:', slots.length);
    
    slots.forEach((slot: Element) => {
        slot.addEventListener('click', () => {
            const slotNumber = parseInt((slot as HTMLElement).dataset.slot || '0');
            console.log('Slot geklickt:', slotNumber);
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

    console.log('Creator-Buttons gefunden:', {
        maleBtn: !!maleBtn,
        femaleBtn: !!femaleBtn,
        saveBtn: !!saveBtn,
        cancelBtn: !!cancelBtn
    });

    if (maleBtn && femaleBtn && saveBtn && cancelBtn) {
        maleBtn.addEventListener('click', () => {
            console.log('Male Button geklickt');
            handleGenderSelection('male', maleBtn, femaleBtn);
        });

        femaleBtn.addEventListener('click', () => {
            console.log('Female Button geklickt');
            handleGenderSelection('female', femaleBtn, maleBtn);
        });

        saveBtn.addEventListener('click', () => {
            console.log('Save Button geklickt');
            handleSaveCharacter();
        });

        cancelBtn.addEventListener('click', () => {
            console.log('Cancel Button geklickt');
            hideCharacterCreator();
        });
    } else {
        console.error('Nicht alle Creator-Buttons gefunden');
    }
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
    window.logDebug('Zeige Charaktererstellung');
    const characterSelection = document.getElementById('character-selection');
    const characterCreatorElement = document.getElementById('character-creator');

    if (!characterSelection || !characterCreatorElement) {
        window.logDebug('Fehler: DOM-Elemente für Charaktererstellung nicht gefunden');
        return;
    }

    characterSelection.style.display = 'none';
    characterCreatorElement.style.display = 'block';
    
    if (!characterCreator) {
        window.logDebug('Initialisiere CharacterCreator');
        characterCreator = CharacterCreator.getInstance();
        characterCreator.initialize().catch(error => {
            window.logDebug(`Fehler bei CharacterCreator-Initialisierung: ${error}`);
            showError('Fehler beim Laden des Charaktereditors');
        });
    }
}

function hideCharacterCreator(): void {
    console.log('Verstecke Charaktererstellung');
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

// Initialisierung
if (document.readyState === 'loading') {
    window.logDebug('Dokument lädt noch, warte auf DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        window.logDebug('DOMContentLoaded ausgelöst');
        initializeApp();
    });
} else {
    window.logDebug('Dokument bereits geladen, starte sofort');
    initializeApp();
} 