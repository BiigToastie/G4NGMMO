import { Game } from './game/Game';
import CharacterCreator from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';
import WebApp from '@twa-dev/sdk';

export class GameManager {
    private static instance: GameManager;
    private game: Game | null = null;
    private characterCreator: CharacterCreator | null = null;
    private container: HTMLElement;
    private characterCreatorContainer: HTMLElement;
    private initialized: boolean = false;

    private constructor() {
        this.container = document.getElementById('game-container') as HTMLElement;
        this.characterCreatorContainer = document.getElementById('character-creator') as HTMLElement;
        if (!this.container || !this.characterCreatorContainer) {
            throw new Error('Required containers not found');
        }
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialisiere ResourceManager
            const resourceManager = ResourceManager.getInstance();
            await resourceManager.preloadAllResources();
            
            this.initialized = true;
            console.log('GameManager erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der GameManager-Initialisierung:', error);
            throw error;
        }
    }

    public async checkExistingCharacter(): Promise<boolean> {
        try {
            const userId = WebApp.initDataUnsafe.user?.id.toString();
            if (!userId) {
                throw new Error('Keine Benutzer-ID gefunden');
            }

            const response = await fetch('/api/character/check', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.hasCharacter;
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Prüfen des Charakters:', error);
            throw error;
        }
    }

    public async startCharacterCreation(): Promise<void> {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // Prüfe zuerst, ob der Spieler bereits einen Charakter hat
            const hasCharacter = await this.checkExistingCharacter();
            if (hasCharacter) {
                // Wenn ein Charakter existiert, leite zum Spiel weiter
                window.location.href = '/game';
                return;
            }

            // Verstecke das Hauptspiel falls vorhanden
            if (this.game) {
                this.container.style.display = 'none';
            }

            // Zeige Charaktererstellung
            this.characterCreatorContainer.style.display = 'block';

            // Initialisiere Charaktererstellung
            this.characterCreator = CharacterCreator.getInstance();
            await this.characterCreator.initialize();
            
            // Event Listener für Charakterbestätigung
            document.addEventListener('character-confirmed', async (event: Event) => {
                const characterData = (event as CustomEvent).detail;
                await this.saveCharacter(characterData);
                window.location.href = '/game';
            });

        } catch (error) {
            console.error('Fehler beim Starten der Charaktererstellung:', error);
            throw error;
        }
    }

    private async saveCharacter(characterData: any): Promise<void> {
        try {
            const userId = WebApp.initDataUnsafe.user?.id.toString();
            if (!userId) {
                throw new Error('Keine Benutzer-ID gefunden');
            }

            const response = await fetch('/api/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                },
                body: JSON.stringify({
                    ...characterData,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 }
                })
            });

            if (!response.ok) {
                throw new Error('Fehler beim Speichern des Charakters');
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Charakters:', error);
            throw error;
        }
    }

    public async startGame(): Promise<void> {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const userId = WebApp.initDataUnsafe.user?.id.toString();
            if (!userId) {
                throw new Error('Keine Benutzer-ID gefunden');
            }

            // Hole Charakterdaten
            const response = await fetch('/api/character/check', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                }
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden des Charakters');
            }

            const data = await response.json();
            if (!data.hasCharacter) {
                window.location.href = '/';
                return;
            }

            // Verstecke Charaktererstellung
            if (this.characterCreator) {
                this.characterCreator.dispose();
                this.characterCreator = null;
                this.characterCreatorContainer.style.display = 'none';
            }

            // Zeige Spiel-Container
            this.container.style.display = 'block';

            // Initialisiere Hauptspiel mit Charakterdaten
            this.game = new Game(this.container, data.character);

        } catch (error) {
            console.error('Fehler beim Starten des Spiels:', error);
            throw error;
        }
    }

    public dispose(): void {
        if (this.characterCreator) {
            this.characterCreator.dispose();
            this.characterCreator = null;
        }
        if (this.game) {
            this.game.dispose();
            this.game = null;
        }
        this.initialized = false;
    }
} 