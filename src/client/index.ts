import { GameManager } from './GameManager';
import WebApp from '@twa-dev/sdk';

async function waitForScripts(): Promise<void> {
    return new Promise((resolve) => {
        const checkScripts = () => {
            const vendorsLoaded = document.querySelector('script[src*="vendors.bundle.js"]')?.hasAttribute('loaded');
            const threeLoaded = document.querySelector('script[src*="threejs.bundle.js"]')?.hasAttribute('loaded');
            
            if (vendorsLoaded && threeLoaded) {
                resolve();
            } else {
                setTimeout(checkScripts, 100);
            }
        };
        checkScripts();
    });
}

async function initializeApp() {
    try {
        console.log('Starte Initialisierung...');
        
        // Aktualisiere Ladetext
        const loadingProgress = document.getElementById('loading-progress');
        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Telegram WebApp...';
        }

        // Telegram WebApp Initialisierung
        if (WebApp.isInitialized) {
            console.log('Telegram WebApp initialisiert');
            WebApp.ready();
            WebApp.expand();
        } else {
            console.warn('Telegram WebApp nicht initialisiert');
        }

        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Spielmanager...';
        }

        // Initialisiere das Spiel basierend auf der Route
        console.log('Erstelle GameManager...');
        const gameManager = GameManager.getInstance();
        const path = window.location.pathname;
        console.log('Aktueller Pfad:', path);

        if (loadingProgress) {
            loadingProgress.textContent = 'Prüfe Charakterstatus...';
        }

        if (path === '/game') {
            console.log('Prüfe existierenden Charakter...');
            // Wenn bereits ein Charakter existiert, starte das Spiel
            const exists = await gameManager.checkExistingCharacter();
            console.log('Charakter existiert:', exists);
            
            if (exists) {
                if (loadingProgress) {
                    loadingProgress.textContent = 'Starte Spiel...';
                }
                console.log('Starte Spiel...');
                await gameManager.startGame();
            } else {
                console.log('Kein Charakter gefunden, Weiterleitung zur Charaktererstellung...');
                window.location.href = '/';
                return;
            }
        } else {
            // Standardmäßig zur Charaktererstellung
            if (loadingProgress) {
                loadingProgress.textContent = 'Lade Charaktererstellung...';
            }
            console.log('Starte Charaktererstellung...');
            await gameManager.startCharacterCreation();
        }

        // Event Listener für das Beenden des Spiels
        window.addEventListener('beforeunload', () => {
            gameManager.dispose();
        });

        console.log('Initialisierung abgeschlossen');
        // Verstecke den Ladebildschirm
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = 'Fehler beim Laden des Spiels. Bitte versuche es erneut.';
            errorMessage.style.display = 'block';
        }
    }
}

// Markiere Skripte als geladen
document.querySelectorAll('script').forEach(script => {
    script.addEventListener('load', () => {
        script.setAttribute('loaded', '');
    });
});

// Starte die Initialisierung wenn das DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 