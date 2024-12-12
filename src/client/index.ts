import { GameManager } from './GameManager';
import WebApp from '@twa-dev/sdk';

function logDebug(message: string, ...args: any[]) {
    console.log(`[DEBUG] ${message}`, ...args);
}

async function waitForScripts(): Promise<void> {
    return new Promise((resolve) => {
        const maxAttempts = 100; // 10 Sekunden maximal
        let attempts = 0;

        const checkScripts = () => {
            logDebug('Skript-Status:', window.scriptsLoaded);
            
            if (window.scriptsLoaded.vendors && 
                window.scriptsLoaded.three && 
                window.scriptsLoaded.main) {
                logDebug('Alle Skripte erfolgreich geladen');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('Timeout beim Laden der Skripte, versuche trotzdem fortzufahren');
                resolve();
            } else {
                attempts++;
                setTimeout(checkScripts, 100);
            }
        };
        checkScripts();
    });
}

async function initializeApp() {
    try {
        logDebug('Starte Initialisierung...');

        // Prüfe ob die Skripte bereits geladen wurden
        logDebug('Prüfe initiale Skript-Status:', window.scriptsLoaded);
        
        // Warte auf das Laden der Skripte
        await waitForScripts();
        logDebug('Skripte geladen, fahre fort mit der Initialisierung');
        
        // Aktualisiere Ladetext
        const loadingProgress = document.getElementById('loading-progress');
        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Telegram WebApp...';
        }

        // Telegram WebApp Initialisierung
        logDebug('WebApp Status:', { isInitialized: WebApp.isInitialized });
        if (WebApp.isInitialized) {
            logDebug('Telegram WebApp initialisiert');
            WebApp.ready();
            WebApp.expand();
        } else {
            console.warn('Telegram WebApp nicht initialisiert, fahre trotzdem fort');
        }

        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Spielmanager...';
        }

        // Initialisiere das Spiel basierend auf der Route
        logDebug('Erstelle GameManager...');
        const gameManager = GameManager.getInstance();
        const path = window.location.pathname;
        logDebug('Aktueller Pfad:', path);

        if (loadingProgress) {
            loadingProgress.textContent = 'Prüfe Charakterstatus...';
        }

        try {
            if (path === '/game') {
                logDebug('Prüfe existierenden Charakter...');
                // Wenn bereits ein Charakter existiert, starte das Spiel
                const exists = await gameManager.checkExistingCharacter();
                logDebug('Charakter existiert:', exists);
                
                if (exists) {
                    if (loadingProgress) {
                        loadingProgress.textContent = 'Starte Spiel...';
                    }
                    logDebug('Starte Spiel...');
                    await gameManager.startGame();
                } else {
                    logDebug('Kein Charakter gefunden, Weiterleitung zur Charaktererstellung...');
                    window.location.href = '/';
                    return;
                }
            } else {
                // Standardmäßig zur Charaktererstellung
                if (loadingProgress) {
                    loadingProgress.textContent = 'Lade Charaktererstellung...';
                }
                logDebug('Starte Charaktererstellung...');
                await gameManager.startCharacterCreation();
            }

            // Event Listener für das Beenden des Spiels
            window.addEventListener('beforeunload', () => {
                gameManager.dispose();
            });

            logDebug('Initialisierung abgeschlossen');
            // Verstecke den Ladebildschirm
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } catch (error) {
            console.error('Fehler während der Spielinitialisierung:', error);
            throw error;
        }
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden des Spiels';
            errorMessage.style.display = 'block';
        }
    }
}

// Deklariere den globalen Typ
declare global {
    interface Window {
        scriptsLoaded: {
            vendors: boolean;
            three: boolean;
            main: boolean;
        };
    }
}

// Starte die Initialisierung wenn das DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        logDebug('DOM geladen, starte Initialisierung');
        initializeApp();
    });
} else {
    logDebug('DOM bereits geladen, starte Initialisierung');
    initializeApp();
} 