import { GameManager } from './GameManager';
import WebApp from '@twa-dev/sdk';

document.addEventListener('DOMContentLoaded', () => {
    // Verstecke den Ladebildschirm wenn alles geladen ist
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    // Initialisiere das Spiel basierend auf der Route
    const gameManager = GameManager.getInstance();
    const path = window.location.pathname;

    if (path === '/game') {
        // Wenn bereits ein Charakter existiert, starte das Spiel
        gameManager.checkExistingCharacter().then(exists => {
            if (exists) {
                gameManager.startGame();
            } else {
                window.location.href = '/';
            }
        });
    } else {
        // Standardmäßig zur Charaktererstellung
        gameManager.startCharacterCreation();
    }

    // Event Listener für das Beenden des Spiels
    window.addEventListener('beforeunload', () => {
        gameManager.dispose();
    });

    // Telegram WebApp Initialisierung
    if (WebApp.isInitialized) {
        WebApp.ready();
        WebApp.expand();
    }
}); 