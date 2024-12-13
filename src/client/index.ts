import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';

async function initializeApp() {
    try {
        console.log('Starte App-Initialisierung...');
        
        // Warte auf WebApp
        await WebApp.ready();
        console.log('WebApp bereit');

        // Initialisiere ResourceManager
        const resourceManager = ResourceManager.getInstance();
        console.log('ResourceManager initialisiert');

        // Zeige Ladebildschirm
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Lade Ressourcen
        console.log('Starte Ressourcenladung...');
        await resourceManager.preloadAllResources();
        console.log('Ressourcen geladen');

        // Initialisiere CharacterCreator
        console.log('Initialisiere CharacterCreator...');
        const characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        // Verstecke Ladebildschirm
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        console.log('App-Initialisierung abgeschlossen');
    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = 'Fehler beim Laden des Spiels. Bitte versuchen Sie es erneut.';
            errorMessage.style.display = 'block';
        }
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Starte die App
initializeApp(); 