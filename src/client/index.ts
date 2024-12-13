import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';

async function initializeApp() {
    try {
        const debugLog = (message: string, isError: boolean = false) => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${message}`);
            
            const debugInfo = document.getElementById('debug-info');
            if (debugInfo) {
                const logEntry = document.createElement('div');
                logEntry.style.color = isError ? '#ec3942' : '#f5f5f5';
                logEntry.textContent = `[${timestamp}] ${message}`;
                debugInfo.appendChild(logEntry);
                debugInfo.scrollTop = debugInfo.scrollHeight;
            }
        };

        debugLog('App-Initialisierung startet...');
        
        // Warte auf WebApp
        debugLog('Warte auf WebApp...');
        await WebApp.ready();
        debugLog('WebApp ist bereit');

        // Initialisiere ResourceManager
        debugLog('Initialisiere ResourceManager...');
        const resourceManager = ResourceManager.getInstance();
        debugLog('ResourceManager initialisiert');

        // Zeige Ladebildschirm
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            debugLog('Ladebildschirm angezeigt');
        }

        // Lade Ressourcen
        debugLog('Starte Ressourcenladung...');
        await resourceManager.preloadAllResources();
        debugLog('Ressourcen erfolgreich geladen');

        // Initialisiere CharacterCreator
        debugLog('Initialisiere CharacterCreator...');
        const characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        debugLog('CharacterCreator initialisiert');

        // Verstecke Ladebildschirm
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            debugLog('Ladebildschirm ausgeblendet');
        }

        debugLog('App-Initialisierung abgeschlossen');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Fehler bei der App-Initialisierung: ${errorMessage}`, true);
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Fehler beim Laden des Spiels. Bitte versuchen Sie es erneut.';
            errorElement.style.display = 'block';
        }
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Warte bis das DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM geladen, starte App...');
        initializeApp();
    });
} else {
    console.log('DOM bereits geladen, starte App...');
    initializeApp();
} 