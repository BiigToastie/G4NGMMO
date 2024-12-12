import { ResourceManager } from './ResourceManager';
import { CharacterCreator } from './character/CharacterCreator';

class Game {
    private static instance: Game;
    private characterCreator: CharacterCreator | null = null;

    private constructor() {}

    public static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
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

            // Erstelle neue Instanz
            this.characterCreator = new CharacterCreator();
            
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            this.showErrorMessage('Fehler bei der Initialisierung des Spiels');
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
}

// Starte das Spiel
Game.getInstance().initialize(); 