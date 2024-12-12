import { ResourceManager } from './ResourceManager';
import { CharacterCreator } from './character/CharacterCreator';

async function initializeGame() {
    console.log('Initialisiere Spiel...');
    
    try {
        // Warte auf DOMContentLoaded
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        console.log('DOM geladen, initialisiere ResourceManager...');
        
        // Initialisiere den ResourceManager und lade alle Ressourcen
        const resourceManager = ResourceManager.getInstance();
        
        console.log('Starte Preloading der Ressourcen...');
        await resourceManager.preloadAllResources();
        console.log('Preloading abgeschlossen');
        
        // Starte die Charaktererstellung
        console.log('Starte Charaktererstellung...');
        new CharacterCreator();
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
}

// Starte die Initialisierung
initializeGame(); 