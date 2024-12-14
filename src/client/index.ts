import WebApp from '@twa-dev/sdk';
import CharacterCreator, { CharacterCreator as CharacterCreatorClass } from './character/CharacterCreator';
import { GameWorld } from './game/GameWorld';

// Interface-Definitionen
export interface CharacterData {
    userId: number;
    gender: 'male' | 'female';
    slot: number;
}

export interface SavedCharacter {
    userId: number;
    gender: 'male' | 'female';
    slot: number;
}

// Globale Variablen
let selectedSlot: number | null = null;
let selectedCharacter: SavedCharacter | null = null;
let characterCreator: CharacterCreator | null = null;
let gameWorld: GameWorld | null = null;

// Getter/Setter für globale Variablen
function getSelectedSlot(): number | null {
    return selectedSlot;
}

function setSelectedSlot(value: number | null): void {
    selectedSlot = value;
}

function getSelectedCharacter(): SavedCharacter | null {
    return selectedCharacter;
}

function setSelectedCharacter(value: SavedCharacter | null): void {
    selectedCharacter = value;
}

function getGameWorld(): GameWorld | null {
    return gameWorld;
}

function setGameWorld(value: GameWorld | null): void {
    gameWorld = value;
}

// Globale Typdeklaration
declare global {
    interface Window {
        CharacterCreator: typeof CharacterCreator;
        characterCreator: CharacterCreator | null;
        logDebug: (message: string) => void;
    }
}

// Sofortige Debug-Ausgabe
console.log('=== Modul-Initialisierung ===');
console.log('CharacterCreator direkt nach Import:', CharacterCreator);
console.log('CharacterCreator Klasse:', CharacterCreatorClass);
console.log('window.CharacterCreator:', window.CharacterCreator);

// Stelle sicher, dass die Klasse global verfügbar ist
if (!window.CharacterCreator) {
    window.CharacterCreator = CharacterCreator;
    console.log('CharacterCreator global zugewiesen');
}

// Definiere die Debug-Funktion
const logDebug = (message: string): void => {
    console.log(message);
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        const timestamp = new Date().toLocaleTimeString();
        debugInfo.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }
};

// Globale Zuweisungen
window.logDebug = logDebug;
window.CharacterCreator = CharacterCreator;
window.characterCreator = null;

logDebug('=== Debug-System initialisiert ===');

// Modifizierte initializeCharacterCreator-Funktion
async function initializeCharacterCreator(): Promise<CharacterCreator> {
    logDebug('=== CharacterCreator Initialisierung ===');
    try {
        logDebug('Prüfe verfügbare Klassen:');
        logDebug(`1. CharacterCreator (Import): ${typeof CharacterCreator}`);
        logDebug(`2. CharacterCreator (Named): ${typeof CharacterCreatorClass}`);
        logDebug(`3. window.CharacterCreator: ${typeof window.CharacterCreator}`);
        logDebug(`4. window.characterCreator: ${window.characterCreator ? 'existiert' : 'null'}`);

        const CreatorClass = CharacterCreator || CharacterCreatorClass || window.CharacterCreator;
        
        if (!CreatorClass) {
            logDebug('Keine CharacterCreator-Klasse gefunden');
            throw new Error('CharacterCreator-Klasse nicht gefunden');
        }

        logDebug('CharacterCreator-Klasse gefunden');
        logDebug(`Typ der Klasse: ${typeof CreatorClass}`);
        logDebug(`getInstance verfügbar: ${typeof CreatorClass.getInstance === 'function'}`);

        if (!window.characterCreator) {
            logDebug('Erstelle neue Instanz...');
            window.characterCreator = CreatorClass.getInstance();
            
            if (!window.characterCreator) {
                throw new Error('getInstance lieferte keine Instanz zurück');
            }

            logDebug('Initialisiere Instanz...');
            await window.characterCreator.initialize();
            logDebug('Instanz erfolgreich initialisiert');
        } else {
            logDebug('Verwende existierende Instanz');
        }

        return window.characterCreator;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logDebug(`Fehler bei der CharacterCreator-Initialisierung: ${errorMsg}`);
        if (error instanceof Error && error.stack) {
            logDebug('Stack Trace:');
            logDebug(error.stack);
        }
        throw error;
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

        // Füge Test-Button hinzu
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Event Handler';
        testButton.style.position = 'fixed';
        testButton.style.bottom = '80px';
        testButton.style.left = '50%';
        testButton.style.transform = 'translateX(-50%)';
        testButton.style.zIndex = '999999';
        testButton.style.padding = '15px 30px';
        testButton.style.backgroundColor = '#4CAF50';
        testButton.style.color = 'white';
        testButton.style.border = 'none';
        testButton.style.borderRadius = '5px';
        testButton.style.cursor = 'pointer';
        testButton.style.fontSize = '16px';
        testButton.style.fontWeight = 'bold';
        testButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        
        testButton.onclick = () => {
            logDebug('Test-Button geklickt');
            console.log('Test-Button geklickt');
            const slots = document.querySelectorAll('.character-slot');
            logDebug(`Gefundene Slots: ${slots.length}`);
            console.log(`Gefundene Slots: ${slots.length}`);
            
            slots.forEach((slot: Element, index: number) => {
                const slotElement = slot as HTMLElement;
                const hasClickHandler = typeof slotElement.onclick === 'function';
                logDebug(`Slot ${index + 1}: Hat Click-Handler: ${hasClickHandler}`);
                console.log(`Slot ${index + 1}: Hat Click-Handler: ${hasClickHandler}`);
                
                // Teste Click-Event
                if (hasClickHandler) {
                    logDebug(`Simuliere Click auf Slot ${index + 1}`);
                    console.log(`Simuliere Click auf Slot ${index + 1}`);
                    slotElement.click();
                }
            });
        };
        
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.appendChild(testButton);
        } else {
            document.body.appendChild(testButton);
        }

        // Lade gespeicherte Charaktere
        logDebug('Lade gespeicherte Charaktere...');
        await loadSavedCharacters();

        // Zeige Charakterauswahl und verstecke Ladebildschirm
        elements.loading!.style.display = 'none';
        elements.characterSelection!.style.display = 'flex';
        logDebug('UI-Elemente aktualisiert');

        // Richte andere Event-Listener ein
        setupCreatorButtons();
        setupGameStartButton();

        // Überprüfe nochmal die Event-Handler
        const slots = document.querySelectorAll('.character-slot');
        slots.forEach((slot: Element, index: number) => {
            const slotElement = slot as HTMLElement;
            const hasClickHandler = typeof slotElement.onclick === 'function';
            logDebug(`Slot ${index + 1} nach Setup: Hat Click-Handler: ${hasClickHandler}`);
        });

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
        const slotElement = slot as HTMLElement;
        const slotNumber = parseInt(slotElement.dataset.slot || '0');
        const character = characters.find(char => char.slot === slotNumber);

        // Aktualisiere Slot-Inhalt
        if (character) {
            slotElement.innerHTML = `
                <div class="character-info">
                    <p>${character.gender === 'male' ? 'Männlich' : 'Weiblich'}</p>
                </div>
            `;
            logDebug(`Slot ${slotNumber} aktualisiert: ${character.gender}`);
        } else {
            slotElement.innerHTML = '<p class="empty-slot-text">Leerer Slot</p>';
            logDebug(`Slot ${slotNumber} ist leer`);
        }

        // Füge Click-Event-Listener hinzu
        slotElement.onclick = async (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            
            logDebug('Click-Event ausgelöst');
            const isEmptySlot = slotElement.querySelector('.empty-slot-text') !== null;
            logDebug(`Slot ${slotNumber} geklickt (${isEmptySlot ? 'leer' : 'belegt'})`);
            
            if (isEmptySlot) {
                try {
                    logDebug('Leerer Slot erkannt, öffne Charaktererstellung');
                    selectedSlot = slotNumber;
                    
                    const characterCreatorElement = document.getElementById('character-creator');
                    const characterSelectionElement = document.getElementById('character-selection');
                    
                    if (!characterCreatorElement || !characterSelectionElement) {
                        logDebug('Fehler: UI-Elemente nicht gefunden');
                        return;
                    }
                    
                    // Initialisiere CharacterCreator vor dem Anzeigen
                    await initializeCharacterCreator();
                    
                    // UI anzeigen
                    characterSelectionElement.style.display = 'none';
                    characterCreatorElement.style.display = 'flex';
                    characterCreatorElement.style.opacity = '1';
                    
                    logDebug('Charaktererstellung angezeigt');
                } catch (error) {
                    logDebug(`Fehler beim Öffnen der Charaktererstellung: ${error}`);
                    showError('Fehler beim Öffnen der Charaktererstellung');
                }
            } else {
                const response = await fetch(`/api/character/${WebApp.initDataUnsafe.user?.id}/${slotNumber}`);
                if (!response.ok) {
                    showError('Fehler beim Laden des Charakters');
                    return;
                }

                selectedCharacter = await response.json();
                document.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
                slotElement.classList.add('selected');
                document.getElementById('start-game')?.removeAttribute('disabled');
            }
        };
        
        logDebug(`Click-Handler für Slot ${slotNumber} registriert`);
    });
    
    logDebug('Charakter-Slots und Event-Handler aktualisiert');
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
        logDebug(`Geschlechterauswahl gestartet: ${gender}`);
        activeBtn.classList.add('selected');
        inactiveBtn.classList.remove('selected');
        
        logDebug('Hole CharacterCreator-Instanz...');
        const creator = await initializeCharacterCreator();
        
        if (!creator) {
            throw new Error('Keine CharacterCreator-Instanz verfügbar');
        }
        
        logDebug(`Setze Geschlecht auf ${gender}...`);
        creator.setGender(gender);
        logDebug(`Geschlecht erfolgreich auf ${gender} gesetzt`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logDebug(`Fehler bei der Geschlechterauswahl: ${errorMsg}`);
        if (error instanceof Error && error.stack) {
            logDebug('Stack Trace:');
            logDebug(error.stack);
        }
        showError('Fehler beim Laden des Charakters');
    }
}

async function handleSaveCharacter(): Promise<void> {
    const selectedSlot = getSelectedSlot();
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
        setSelectedSlot(null);

    } catch (error) {
        logDebug(`Fehler beim Speichern: ${error instanceof Error ? error.message : String(error)}`);
        showError('Fehler beim Speichern des Charakters');
    }
}

async function startGame(): Promise<void> {
    const selectedCharacter = getSelectedCharacter();
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

        const gameWorld = GameWorld.getInstance();
        setGameWorld(gameWorld);
        
        if (!gameWorld) {
            throw new Error('GameWorld konnte nicht initialisiert werden');
        }
        
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

        characterSelection.style.display = 'none';
        characterCreatorElement.style.display = 'flex';
        characterCreatorElement.style.opacity = '1';
        
        logDebug('Charaktererstellung-UI aktualisiert');
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