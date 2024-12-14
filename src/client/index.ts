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

// Debug-Logging-Funktion
function logDebug(message: string): void {
    console.log(message);
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        const timestamp = new Date().toLocaleTimeString();
        debugInfo.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }
}

async function waitForWebApp(): Promise<void> {
    logDebug('Warte auf WebApp...');
    try {
        // Initialisiere WebApp mit korrekten Parametern
        WebApp.expand();
        WebApp.enableClosingConfirmation();
        await WebApp.ready();
        logDebug('WebApp ist bereit');
    } catch (error) {
        logDebug('Fehler beim Warten auf WebApp');
        throw error;
    }
}

async function initializeApp(): Promise<void> {
    try {
        logDebug('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await waitForWebApp();

        // Prüfe DOM-Elemente
        const elements = {
            loading: document.getElementById('loading'),
            characterSelection: document.getElementById('character-selection'),
            characterCreator: document.getElementById('character-creator'),
            gameWorld: document.getElementById('game-world'),
            debugInfo: document.getElementById('debug-info')
        };

        // Überprüfe alle erforderlichen Elemente
        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                throw new Error(`Element ${name} nicht gefunden`);
            }
            logDebug(`Element ${name} gefunden`);
        });

        // Verstecke alle UI-Elemente außer Loading
        elements.characterSelection!.style.display = 'none';
        elements.characterCreator!.style.display = 'none';
        elements.gameWorld!.style.display = 'none';

        // Lade gespeicherte Charaktere
        logDebug('Lade gespeicherte Charaktere...');
        await loadSavedCharacters();

        // Zeige Charakterauswahl und verstecke Ladebildschirm
        elements.loading!.style.display = 'none';
        elements.characterSelection!.style.display = 'flex';
        logDebug('UI-Elemente aktualisiert');

        // Füge Click-Handler für Charakter-Slots hinzu
        document.querySelectorAll('.character-slot').forEach((slot: Element) => {
            console.log('Füge Handler für Slot hinzu:', (slot as HTMLElement).dataset.slot);
            slot.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('Slot geklickt!');
                logDebug('Slot wurde geklickt');
                
                const slotElement = event.currentTarget as HTMLElement;
                const slotNumber = parseInt(slotElement.dataset.slot || '0');
                const isEmptySlot = slotElement.querySelector('.empty-slot-text') !== null;
                
                logDebug(`Slot ${slotNumber} geklickt (${isEmptySlot ? 'leer' : 'belegt'})`);
                
                if (isEmptySlot) {
                    logDebug('Leerer Slot erkannt, öffne Charaktererstellung');
                    selectedSlot = slotNumber;
                    
                    const characterCreatorElement = document.getElementById('character-creator');
                    const characterSelectionElement = document.getElementById('character-selection');
                    
                    if (characterCreatorElement && characterSelectionElement) {
                        characterSelectionElement.style.display = 'none';
                        characterCreatorElement.style.display = 'flex';
                        characterCreatorElement.style.opacity = '1';
                        
                        if (!characterCreator) {
                            characterCreator = CharacterCreator.getInstance();
                            characterCreator.initialize().then(() => {
                                logDebug('CharacterCreator initialisiert');
                            }).catch(error => {
                                logDebug(`Fehler bei CharacterCreator-Initialisierung: ${error}`);
                            });
                        }
                    } else {
                        logDebug('Fehler: UI-Elemente nicht gefunden');
                    }
                } else {
                    handleSlotClick(slotNumber, slotElement);
                }
            });
        });

        // Richte andere Event-Listener ein
        setupCreatorButtons();
        setupGameStartButton();

        logDebug('App-Initialisierung abgeschlossen');

    } catch (error) {
        logDebug(`Fehler bei der App-Initialisierung: ${error instanceof Error ? error.message : String(error)}`);
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
        logDebug(`${characters.length} Charaktere geladen`);
    } catch (error) {
        logDebug(`Fehler beim Laden der gespeicherten Charaktere: ${error instanceof Error ? error.message : String(error)}`);
        showError('Fehler beim Laden der Charaktere');
    }
}

function updateCharacterSlots(characters: SavedCharacter[]): void {
    logDebug('Aktualisiere Charakter-Slots...');
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
            logDebug(`Slot ${slotNumber} aktualisiert: ${character.gender}`);
        } else {
            slot.innerHTML = '<p class="empty-slot-text">Leerer Slot</p>';
            logDebug(`Slot ${slotNumber} ist leer`);
        }
    });
    logDebug('Charakter-Slots aktualisiert');
}

function setupEventListeners(): void {
    logDebug('Richte Event-Listener ein...');
    
    // Character Slots
    const slots = document.querySelectorAll('.character-slot');
    logDebug(`${slots.length} Character-Slots gefunden`);
    
    slots.forEach((slot: Element) => {
        logDebug(`Füge Click-Handler für Slot ${(slot as HTMLElement).dataset.slot} hinzu`);
        
        // Entferne vorhandene Event-Listener
        slot.removeEventListener('click', handleSlotClickWrapper);
        
        // Füge neuen Event-Listener hinzu
        slot.addEventListener('click', handleSlotClickWrapper);
    });

    // Creator Buttons
    setupCreatorButtons();
    
    // Game Start Button
    setupGameStartButton();
    
    logDebug('Event-Listener erfolgreich eingerichtet');
}

// Wrapper-Funktion für den Click-Handler
function handleSlotClickWrapper(event: Event): void {
    logDebug('handleSlotClickWrapper aufgerufen');
    event.preventDefault();
    event.stopPropagation();
    
    const slotElement = event.currentTarget as HTMLElement;
    if (!slotElement) {
        logDebug('Fehler: Kein gültiges Event-Target gefunden');
        return;
    }
    
    const slotNumber = parseInt(slotElement.dataset.slot || '0');
    logDebug(`Click-Event auf Slot ${slotNumber} ausgelöst`);
    
    // Prüfe ob der Slot leer ist
    const isEmptySlot = slotElement.querySelector('.empty-slot-text') !== null;
    logDebug(`Slot ${slotNumber} Status: ${isEmptySlot ? 'leer' : 'belegt'}`);
    
    if (isEmptySlot) {
        logDebug('Leerer Slot erkannt, öffne Charaktererstellung direkt');
        selectedSlot = slotNumber;
        
        // Direkte UI-Manipulation
        const characterCreatorElement = document.getElementById('character-creator');
        const characterSelectionElement = document.getElementById('character-selection');
        
        if (characterCreatorElement && characterSelectionElement) {
            logDebug('UI-Elemente gefunden, führe Übergang durch');
            characterSelectionElement.style.display = 'none';
            characterCreatorElement.style.display = 'flex';
            characterCreatorElement.style.opacity = '1';
            showCharacterCreator();
        } else {
            logDebug('Fehler: UI-Elemente nicht gefunden');
        }
    } else {
        handleSlotClick(slotNumber, slotElement);
    }
}

async function handleSlotClick(slotNumber: number, slotElement: HTMLElement): Promise<void> {
    try {
        logDebug(`Verarbeite Slot-Klick für Slot ${slotNumber}`);
        const isEmptySlot = slotElement.querySelector('.empty-slot-text') !== null;
        logDebug(`Slot ${slotNumber} Status: ${isEmptySlot ? 'leer' : 'belegt'}`);

        if (!WebApp.initDataUnsafe.user?.id) {
            showError('Keine Benutzer-ID gefunden');
            return;
        }

        if (isEmptySlot) {
            logDebug('Leerer Slot geklickt, zeige Charaktererstellung');
            selectedSlot = slotNumber;
            
            const characterCreator = document.getElementById('character-creator');
            const characterSelection = document.getElementById('character-selection');
            
            if (!characterCreator || !characterSelection) {
                logDebug('Fehler: UI-Elemente nicht gefunden');
                return;
            }

            // Direkte Style-Änderungen
            characterSelection.style.display = 'none';
            characterCreator.style.display = 'flex';
            characterCreator.style.opacity = '1';
            
            logDebug('Charaktererstellung angezeigt');
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
    } catch (error) {
        logDebug(`Fehler beim Slot-Click-Handling: ${error instanceof Error ? error.message : String(error)}`);
        showError('Fehler beim Öffnen der Charaktererstellung');
    }
}

function setupCreatorButtons(): void {
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    const saveBtn = document.getElementById('save-character');
    const cancelBtn = document.getElementById('cancel-creation');

    logDebug('Suche Creator-Buttons...');
    logDebug(`Male Button gefunden: ${!!maleBtn}`);
    logDebug(`Female Button gefunden: ${!!femaleBtn}`);
    logDebug(`Save Button gefunden: ${!!saveBtn}`);
    logDebug(`Cancel Button gefunden: ${!!cancelBtn}`);

    if (maleBtn && femaleBtn && saveBtn && cancelBtn) {
        maleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logDebug('Male Button geklickt');
            handleGenderSelection('male', maleBtn, femaleBtn);
        });
        femaleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logDebug('Female Button geklickt');
            handleGenderSelection('female', femaleBtn, maleBtn);
        });
        saveBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logDebug('Save Button geklickt');
            handleSaveCharacter();
        });
        cancelBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logDebug('Cancel Button geklickt');
            hideCharacterCreator();
        });
        logDebug('Creator-Buttons eingerichtet');
    } else {
        logDebug('Fehler: Nicht alle Creator-Buttons gefunden');
    }
}

function setupGameStartButton(): void {
    const startBtn = document.getElementById('start-game');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
        logDebug('Start-Button eingerichtet');
    }
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
        logDebug(`Geschlecht gewählt: ${gender}`);
    } catch (error) {
        logDebug(`Fehler bei der Geschlechterauswahl: ${error instanceof Error ? error.message : String(error)}`);
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

        logDebug('Charakter erfolgreich gespeichert');
        await loadSavedCharacters();
        hideCharacterCreator();
        selectedSlot = null;

    } catch (error) {
        logDebug(`Fehler beim Speichern: ${error instanceof Error ? error.message : String(error)}`);
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

        logDebug('Spiel erfolgreich gestartet');
    } catch (error) {
        logDebug(`Fehler beim Spielstart: ${error instanceof Error ? error.message : String(error)}`);
        showError('Fehler beim Starten des Spiels');
    }
}

function showCharacterCreator(): void {
    try {
        logDebug('Zeige Charaktererstellung');
        const characterSelection = document.getElementById('character-selection');
        const characterCreatorElement = document.getElementById('character-creator');

        if (!characterSelection || !characterCreatorElement) {
            logDebug('Fehler: DOM-Elemente für Charaktererstellung nicht gefunden');
            return;
        }

        // Direkte Style-Änderungen ohne Verzögerung
        characterSelection.style.display = 'none';
        characterCreatorElement.style.display = 'flex';
        characterCreatorElement.style.opacity = '1';
        
        logDebug('Charaktererstellung-UI aktualisiert');
        
        // Initialisiere CharacterCreator sofort
        if (!characterCreator) {
            logDebug('Initialisiere CharacterCreator');
            characterCreator = CharacterCreator.getInstance();
            characterCreator.initialize().then(() => {
                logDebug('CharacterCreator erfolgreich initialisiert');
            }).catch(error => {
                logDebug(`Fehler bei CharacterCreator-Initialisierung: ${error}`);
                showError('Fehler beim Laden des Charaktereditors');
            });
        } else {
            logDebug('CharacterCreator bereits initialisiert');
        }
    } catch (error) {
        logDebug(`Fehler beim Anzeigen der Charaktererstellung: ${error instanceof Error ? error.message : String(error)}`);
        showError('Fehler beim Öffnen der Charaktererstellung');
    }
}

function hideCharacterCreator(): void {
    logDebug('Verstecke Charaktererstellung');
    const characterSelection = document.getElementById('character-selection');
    const characterCreatorElement = document.getElementById('character-creator');

    if (!characterSelection || !characterCreatorElement) {
        logDebug('Fehler: DOM-Elemente für Charaktererstellung nicht gefunden');
        return;
    }

    // Sanfte Überblendung
    characterCreatorElement.style.opacity = '0';
    setTimeout(() => {
        characterCreatorElement.style.display = 'none';
        characterSelection.style.display = 'flex';
        setTimeout(() => {
            characterSelection.style.opacity = '1';
        }, 50);
    }, 300);
}

function showError(message: string): void {
    logDebug(`Fehler: ${message}`);
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
    logDebug('Dokument lädt noch, warte auf DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    logDebug('Dokument bereits geladen, starte sofort');
    initializeApp();
} 