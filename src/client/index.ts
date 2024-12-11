import { CharacterCreator } from './character/CharacterCreator';
import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    if (!container) {
        console.error('Container element not found');
        return;
    }

    const characterCreator = new CharacterCreator(container);

    // Event Listener für UI-Elemente
    const bodyTypeSelect = document.getElementById('body-type') as HTMLSelectElement;
    const heightInput = document.getElementById('height') as HTMLInputElement;
    const heightValue = document.getElementById('height-value') as HTMLSpanElement;
    const skinToneInput = document.getElementById('skin-tone') as HTMLInputElement;
    const eyeColorInput = document.getElementById('eye-color') as HTMLInputElement;
    const expressionButtons = document.querySelectorAll('.expression-button');
    const hairStyleSelect = document.getElementById('hair-style') as HTMLSelectElement;
    const hairColorInput = document.getElementById('hair-color') as HTMLInputElement;
    const shirtStyleSelect = document.getElementById('shirt-style') as HTMLSelectElement;
    const shirtColorInput = document.getElementById('shirt-color') as HTMLInputElement;
    const pantsStyleSelect = document.getElementById('pants-style') as HTMLSelectElement;
    const pantsColorInput = document.getElementById('pants-color') as HTMLInputElement;
    const saveButton = document.getElementById('save-character') as HTMLButtonElement;

    // Event Handler
    bodyTypeSelect?.addEventListener('change', () => {
        characterCreator.setBodyType(bodyTypeSelect.value as 'slim' | 'average' | 'athletic');
    });

    heightInput?.addEventListener('input', () => {
        const height = parseInt(heightInput.value);
        heightValue.textContent = `${height} cm`;
        characterCreator.setHeight(height);
    });

    skinToneInput?.addEventListener('input', () => {
        characterCreator.setSkinTone(new THREE.Color(skinToneInput.value));
    });

    eyeColorInput?.addEventListener('input', () => {
        characterCreator.setEyeColor(new THREE.Color(eyeColorInput.value));
    });

    expressionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Aktiven Button aktualisieren
            expressionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Gesichtsausdruck setzen
            const expression = button.getAttribute('data-expression') as 'neutral' | 'happy' | 'sad';
            characterCreator.setFacialExpression(expression);
        });
    });

    hairStyleSelect?.addEventListener('change', () => {
        characterCreator.setHairStyle(hairStyleSelect.value);
    });

    hairColorInput?.addEventListener('input', () => {
        characterCreator.setHairColor(new THREE.Color(hairColorInput.value));
    });

    shirtStyleSelect?.addEventListener('change', () => {
        characterCreator.setClothing('shirt', new THREE.Color(shirtColorInput.value));
    });

    shirtColorInput?.addEventListener('input', () => {
        characterCreator.setClothing('shirt', new THREE.Color(shirtColorInput.value));
    });

    pantsStyleSelect?.addEventListener('change', () => {
        characterCreator.setClothing('pants', new THREE.Color(pantsColorInput.value));
    });

    pantsColorInput?.addEventListener('input', () => {
        characterCreator.setClothing('pants', new THREE.Color(pantsColorInput.value));
    });

    saveButton?.addEventListener('click', async () => {
        const characterData = characterCreator.exportCharacter();
        try {
            const response = await fetch('/api/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 'current-user-id', // TODO: Implementiere echte Benutzer-ID
                    character: characterData
                }),
            });

            if (response.ok) {
                alert('Charakter erfolgreich gespeichert!');
                window.location.href = '/game';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Speichern des Charakters');
            }
        } catch (error) {
            console.error('Fehler:', error);
            alert('Fehler beim Speichern des Charakters. Bitte versuche es später erneut.');
        }
    });
}); 