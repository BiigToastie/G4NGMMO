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
        
        // Debug-Button anzeigen
        const debugButton = document.getElementById('debug-toggle');
        if (debugButton) {
            debugButton.style.display = 'block';
        }
        
        // Warte auf WebApp
        debugLog('Warte auf WebApp...');
        await WebApp.ready();
        debugLog('WebApp ist bereit');

        // Prüfe Verzeichnisstruktur
        debugLog('Prüfe Verzeichnisstruktur...');
        try {
            const response = await fetch('/debug/models');
            const data = await response.json();
            debugLog(`Verzeichnisstruktur: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            debugLog(`Fehler beim Prüfen der Verzeichnisstruktur: ${error}`, true);
        }

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
        try {
            await resourceManager.preloadAllResources();
            debugLog('Ressourcen erfolgreich geladen');
        } catch (error) {
            debugLog(`Fehler beim Laden der Ressourcen: ${error}`, true);
            throw error;
        }

        // Initialisiere CharacterCreator
        debugLog('Initialisiere CharacterCreator...');
        try {
            const characterCreator = CharacterCreator.getInstance();
            await characterCreator.initialize();
            debugLog('CharacterCreator initialisiert');
        } catch (error) {
            debugLog(`Fehler bei der CharacterCreator-Initialisierung: ${error}`, true);
            throw error;
        }

        // Verstecke Ladebildschirm
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            debugLog('Ladebildschirm ausgeblendet');
        }

        debugLog('App-Initialisierung abgeschlossen');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Fehler bei der App-Initialisierung: ${errorMessage}`, true);
        if (error instanceof Error && error.stack) {
            debugLog(`Stack Trace: ${error.stack}`, true);
        }
        
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
        debugLog('DOM geladen, starte App...');
        initializeApp();
    });
} else {
    debugLog('DOM bereits geladen, starte App...');
    initializeApp();
} 