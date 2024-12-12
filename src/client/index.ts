import { ResourceManager } from './ResourceManager';
import { CharacterCreator } from './character/CharacterCreator';

async function initializeGame() {
    try {
        // Initialisiere den ResourceManager und lade alle Ressourcen
        const resourceManager = ResourceManager.getInstance();
        await resourceManager.preloadAllResources();
        
        // Starte die Charaktererstellung erst nach dem Laden der Ressourcen
        window.addEventListener('DOMContentLoaded', () => {
            new CharacterCreator();
        });
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
}

// Starte die Initialisierung
initializeGame(); 