import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';
import { ResourceManager } from './ResourceManager';

// Globale Debug-Funktion
function debugLog(message: string, isError: boolean = false) {
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
}

async function initializeApp() {
    try {
        debugLog('App-Initialisierung startet...');
        
        // Prüfe Debug-Fenster
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) {
            console.error('Debug-Fenster nicht gefunden!');
            throw new Error('Debug-Fenster nicht gefunden');
        }
        
        // Warte auf WebApp
        debugLog('Warte auf WebApp...');
        await WebApp.ready();
        debugLog('WebApp ist bereit');

        // Prüfe Ladebildschirm
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            debugLog('Ladebildschirm nicht gefunden!', true);
            throw new Error('Ladebildschirm nicht gefunden');
        }

        // Zeige Ladebildschirm
        loadingOverlay.style.display = 'flex';
        debugLog('Ladebildschirm angezeigt');

        // Initialisiere ResourceManager
        debugLog('Initialisiere ResourceManager...');
        const resourceManager = ResourceManager.getInstance();
        debugLog('ResourceManager initialisiert');

        // Lade Ressourcen
        debugLog('Starte Ressourcenladung...');
        try {
            await resourceManager.preloadAllResources();
            debugLog('Ressourcen erfolgreich geladen');
        } catch (error) {
            debugLog('Fehler beim Laden der Ressourcen', true);
            throw error;
        }

        // Initialisiere CharacterCreator
        debugLog('Initialisiere CharacterCreator...');
        try {
            const characterCreator = CharacterCreator.getInstance();
            await characterCreator.initialize();
            debugLog('CharacterCreator initialisiert');
        } catch (error) {
            debugLog('Fehler bei der CharacterCreator-Initialisierung', true);
            throw error;
        }

        // Verstecke Ladebildschirm
        loadingOverlay.style.display = 'none';
        debugLog('Ladebildschirm ausgeblendet');

        debugLog('App-Initialisierung abgeschlossen');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Fehler bei der App-Initialisierung: ${errorMessage}`, true);
        
        // Zeige Fehlermeldung
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Fehler beim Laden: ${errorMessage}`;
            errorElement.style.display = 'block';
        }
        
        // Verstecke Ladebildschirm bei Fehler
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Log Stack Trace
        if (error instanceof Error && error.stack) {
            debugLog(`Stack Trace: ${error.stack}`, true);
        }
    }
}

// Warte bis das DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        debugLog('DOM geladen, starte App...');
        initializeApp().catch(error => {
            debugLog(`Kritischer Fehler: ${error}`, true);
        });
    });
} else {
    debugLog('DOM bereits geladen, starte App...');
    initializeApp().catch(error => {
        debugLog(`Kritischer Fehler: ${error}`, true);
    });
} 