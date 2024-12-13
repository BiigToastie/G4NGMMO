import WebApp from '@twa-dev/sdk';
import { CharacterCreator } from './character/CharacterCreator';

let characterCreator: CharacterCreator;

async function initializeApp() {
    try {
        console.log('App-Initialisierung startet...');
        
        // Warte auf WebApp
        await WebApp.ready();
        console.log('WebApp ist bereit');

        // Initialisiere CharacterCreator
        characterCreator = CharacterCreator.getInstance();
        await characterCreator.initialize();
        console.log('CharacterCreator initialisiert');

        // Lade initiales männliches Modell
        await characterCreator.updateCharacter('male');
        console.log('Initiales Modell geladen');

        // Event-Listener für Geschlechterauswahl
        const maleBtn = document.getElementById('male-btn');
        const femaleBtn = document.getElementById('female-btn');

        maleBtn?.addEventListener('click', async () => {
            try {
                maleBtn.classList.add('selected');
                femaleBtn?.classList.remove('selected');
                await characterCreator.updateCharacter('male');
            } catch (error) {
                console.error('Fehler beim Laden des männlichen Charakters:', error);
                showError('Fehler beim Laden des Charakters');
            }
        });

        femaleBtn?.addEventListener('click', async () => {
            try {
                femaleBtn.classList.add('selected');
                maleBtn?.classList.remove('selected');
                await characterCreator.updateCharacter('female');
            } catch (error) {
                console.error('Fehler beim Laden des weiblichen Charakters:', error);
                showError('Fehler beim Laden des Charakters');
            }
        });

        // Event-Listener für Klassen-Buttons
        const classButtons = ['warrior', 'mage', 'ranger', 'rogue'].map(className => 
            document.getElementById(`${className}-btn`)
        );

        classButtons.forEach((btn, index) => {
            btn?.addEventListener('click', () => {
                classButtons.forEach(b => b?.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Event-Listener für Speichern-Button
        const saveBtn = document.getElementById('save-character');
        saveBtn?.addEventListener('click', async () => {
            try {
                const selectedGender = document.getElementById('male-btn')?.classList.contains('selected') ? 'male' : 'female';
                const selectedClass = ['warrior', 'mage', 'ranger', 'rogue'].find(className => 
                    document.getElementById(`${className}-btn`)?.classList.contains('selected')
                ) || 'warrior';

                const response = await fetch('/api/character/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: WebApp.initDataUnsafe.user?.id,
                        gender: selectedGender,
                        class: selectedClass
                    })
                });

                if (!response.ok) {
                    throw new Error('Fehler beim Speichern des Charakters');
                }

                WebApp.close();
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                showError('Fehler beim Speichern des Charakters');
            }
        });

    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        showError('Fehler beim Laden des Spiels');
    }
}

function showError(message: string) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// Starte die App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 