import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';

async function initializeApp() {
    try {
        console.log('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await WebApp.ready();
        console.log('WebApp ist bereit');

        // Zeige direkt die Charakterauswahl
        const characterSelection = document.getElementById('character-selection');
        if (characterSelection) {
            characterSelection.style.display = 'flex';
        }

        // Initialisiere CharacterCreator
        const characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        // Verstecke Ladebildschirm falls vorhanden
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Fehler beim Laden des Spiels. Bitte versuchen Sie es erneut.';
            errorElement.style.display = 'block';
        }
    }
}

// Starte die App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 