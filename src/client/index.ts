import { GameManager } from './GameManager';
import WebApp from '@twa-dev/sdk';

async function initializeApp() {
    try {
        // Aktualisiere Ladetext
        const loadingProgress = document.getElementById('loading-progress');
        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Telegram WebApp...';
        }

        // Telegram WebApp Initialisierung
        if (WebApp.isInitialized) {
            WebApp.ready();
            WebApp.expand();
        }

        if (loadingProgress) {
            loadingProgress.textContent = 'Initialisiere Spielmanager...';
        }

        // Initialisiere das Spiel basierend auf der Route
        const gameManager = GameManager.getInstance();
        const path = window.location.pathname;

        if (loadingProgress) {
            loadingProgress.textContent = 'Prüfe Charakterstatus...';
        }

        if (path === '/game') {
            // Wenn bereits ein Charakter existiert, starte das Spiel
            const exists = await gameManager.checkExistingCharacter();
            if (exists) {
                if (loadingProgress) {
                    loadingProgress.textContent = 'Starte Spiel...';
                }
                await gameManager.startGame();
            } else {
                window.location.href = '/';
                return;
            }
        } else {
            // Standardmäßig zur Charaktererstellung
            if (loadingProgress) {
                loadingProgress.textContent = 'Lade Charaktererstellung...';
            }
            await gameManager.startCharacterCreation();
        }

        // Event Listener für das Beenden des Spiels
        window.addEventListener('beforeunload', () => {
            gameManager.dispose();
        });

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

// Starte die Initialisierung wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initializeApp); 