import { ResourceManager } from './ResourceManager';
import { CharacterCreator } from './character/CharacterCreator';
import WebApp from '@twa-dev/sdk';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
}

class Game {
    private static instance: Game | null = null;
    private characterCreator: CharacterCreator | null = null;
    private selectedClass: string | null = null;
    private playerName: string = '';

    private constructor() {
        this.initializeTelegram();
    }

    public static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    private initializeTelegram(): void {
        try {
            // Initialisiere Telegram WebApp
            WebApp.ready();
            
            // Hole Benutzerinformationen
            const user = WebApp.initDataUnsafe?.user as TelegramUser | undefined;
            if (user) {
                this.playerName = user.first_name;
                this.updatePlayerName();
            } else {
                console.warn('Keine Benutzerinformationen gefunden');
                this.playerName = 'Unbekannter Held';
                this.updatePlayerName();
            }

            // Setze Theme
            document.body.className = WebApp.colorScheme;
        } catch (error) {
            console.error('Fehler bei der Telegram-Initialisierung:', error);
            this.showErrorMessage('Fehler bei der Telegram-Initialisierung');
        }
    }

    private updatePlayerName(): void {
        const nameElement = document.getElementById('player-name');
        if (nameElement) {
            nameElement.textContent = this.playerName;
        }
    }

    public async initialize(): Promise<void> {
        console.log('Spiel wird initialisiert...');
        
        try {
            // Warte auf DOMContentLoaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            console.log('DOM geladen, initialisiere ResourceManager...');
            
            // Initialisiere den ResourceManager und lade alle Ressourcen
            const resourceManager = ResourceManager.getInstance();
            
            // Entferne alte Instanz falls vorhanden
            if (this.characterCreator) {
                this.characterCreator.dispose();
                this.characterCreator = null;
            }

            // Erstelle und initialisiere neue Instanz
            this.characterCreator = CharacterCreator.getInstance();
            await this.characterCreator.initialize();
            
            // Initialisiere UI-Events
            this.setupUIEvents();
            
            console.log('Spiel erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            this.showErrorMessage('Fehler bei der Initialisierung des Spiels');
        }
    }

    private setupUIEvents(): void {
        // Geschlechterauswahl
        document.querySelectorAll('.selection-button[data-gender]').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const gender = target.dataset.gender as 'male' | 'female';
                
                // Update UI
                document.querySelectorAll('.selection-button[data-gender]').forEach(btn => {
                    btn.classList.remove('selected');
                });
                target.classList.add('selected');

                // Update Character
                if (this.characterCreator) {
                    this.characterCreator.switchCharacter(gender);
                }
            });
        });

        // Klassenauswahl
        document.querySelectorAll('.selection-button[data-class]').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const characterClass = target.dataset.class;
                
                // Update UI
                document.querySelectorAll('.selection-button[data-class]').forEach(btn => {
                    btn.classList.remove('selected');
                });
                target.classList.add('selected');

                // Update selected class
                this.selectedClass = characterClass || null;
                this.updateConfirmButton();
            });
        });

        // Bestätigungsbutton
        const confirmButton = document.getElementById('confirm-button');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => this.createCharacter());
        }
    }

    private updateConfirmButton(): void {
        const confirmButton = document.getElementById('confirm-button');
        if (confirmButton) {
            confirmButton.disabled = !this.selectedClass;
        }
    }

    private async createCharacter(): Promise<void> {
        if (!this.selectedClass) return;

        try {
            const characterData = {
                name: this.playerName,
                class: this.selectedClass,
                telegramId: (WebApp.initDataUnsafe?.user as TelegramUser)?.id
            };

            const response = await fetch('/api/character/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(characterData)
            });

            if (!response.ok) {
                throw new Error('Fehler beim Speichern des Charakters');
            }

            // Charakter erfolgreich erstellt
            WebApp.close();
        } catch (error) {
            console.error('Fehler beim Erstellen des Charakters:', error);
            this.showErrorMessage('Fehler beim Erstellen des Charakters');
        }
    }

    private showErrorMessage(message: string): void {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    public dispose(): void {
        if (this.characterCreator) {
            this.characterCreator.dispose();
            this.characterCreator = null;
        }
        if (Game.instance) {
            Game.instance = null;
        }
    }
}

// Starte das Spiel
Game.getInstance().initialize(); 