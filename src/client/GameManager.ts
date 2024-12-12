import { Game } from './game/Game';
import { CharacterCreator } from './character/CharacterCreator';
import * as THREE from 'three';

export class GameManager {
    private static instance: GameManager;
    private game: Game | null = null;
    private characterCreator: CharacterCreator | null = null;
    private container: HTMLElement;
    private characterCreatorContainer: HTMLElement;

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

    public async checkExistingCharacter(): Promise<boolean> {
        try {
            const response = await fetch('/api/character/check', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.hasCharacter;
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Prüfen des Charakters:', error);
            return false;
        }
    }

    public async startCharacterCreation(): Promise<void> {
        try {
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
            const response = await fetch('/api/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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

    public async startGame(characterData?: any): Promise<void> {
        try {
            if (!characterData) {
                // Hole Charakterdaten wenn nicht übergeben
                const response = await fetch('/api/character/check', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
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
                characterData = data.character;
            }

            // Verstecke Charaktererstellung
            if (this.characterCreator) {
                this.characterCreator.dispose();
                this.characterCreator = null;
                this.characterCreatorContainer.style.display = 'none';
            }

            // Zeige Spiel-Container
            this.container.style.display = 'block';

            // Initialisiere Hauptspiel
            this.game = new Game(this.container);

            // Spawn Charakter an gespeicherter oder Standard-Position
            const position = characterData.position || { x: 0, y: 0, z: 0 };
            const spawnPosition = new THREE.Vector3(position.x, position.y, position.z);
            this.game.spawnPlayer(characterData.userId, spawnPosition);
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
            // Cleanup für das Hauptspiel
            this.game = null;
        }
    }
} 