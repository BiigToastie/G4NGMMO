import express, { Request, Response, NextFunction } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import characterRoutes from './routes/character';

// Umgebungsvariablen laden
dotenv.config();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log('Mit MongoDB verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Express Server
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routen
app.use('/api/character', characterRoutes);

// Game-Route für den Vollbildmodus
app.get('/game', (req: Request, res: Response) => {
    try {
        res.send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>G4NG MMO - Charaktererstellung</title>
                <script src="https://telegram.org/js/telegram-web-app.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: #000;
                        font-family: Arial, sans-serif;
                        color: white;
                    }
                    #game-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                    }
                    #character-view {
                        width: 70%;
                        height: 100%;
                    }
                    #customization-panel {
                        width: 30%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        padding: 20px;
                        box-sizing: border-box;
                        overflow-y: auto;
                    }
                    .slider-container {
                        margin: 15px 0;
                    }
                    .slider-container label {
                        display: block;
                        margin-bottom: 5px;
                    }
                    .slider-container input[type="range"] {
                        width: 100%;
                        margin: 5px 0;
                    }
                    .option-container {
                        margin: 15px 0;
                    }
                    .color-picker {
                        width: 100%;
                        height: 40px;
                        margin: 5px 0;
                    }
                    #confirm-button {
                        width: 100%;
                        padding: 15px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 5px;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 20px;
                    }
                    #confirm-button:hover {
                        background: #45a049;
                    }
                    .gender-select {
                        display: flex;
                        justify-content: space-between;
                        margin: 15px 0;
                    }
                    .gender-button {
                        width: 48%;
                        padding: 10px;
                        border: 2px solid #4CAF50;
                        background: transparent;
                        color: white;
                        cursor: pointer;
                        border-radius: 5px;
                    }
                    .gender-button.selected {
                        background: #4CAF50;
                    }
                    #name-input {
                        width: 100%;
                        padding: 10px;
                        margin: 10px 0;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid #4CAF50;
                        border-radius: 5px;
                        color: white;
                    }
                    #name-input::placeholder {
                        color: rgba(255, 255, 255, 0.5);
                    }
                </style>
            </head>
            <body>
                <div id="game-container">
                    <div id="character-view"></div>
                    <div id="customization-panel">
                        <h2>Charaktererstellung</h2>
                        
                        <div class="gender-select">
                            <button class="gender-button selected" onclick="selectGender('male')">Männlich</button>
                            <button class="gender-button" onclick="selectGender('female')">Weiblich</button>
                        </div>

                        <div class="slider-container">
                            <label>Körpergröße</label>
                            <input type="range" min="150" max="200" value="175" oninput="updateCharacter('height', this.value)">
                            <span class="value">175 cm</span>
                        </div>

                        <div class="slider-container">
                            <label>Statur</label>
                            <input type="range" min="1" max="100" value="50" oninput="updateCharacter('build', this.value)">
                            <span class="value">Normal</span>
                        </div>

                        <div class="option-container">
                            <label>Hautfarbe</label>
                            <input type="color" class="color-picker" value="#ffdbac" oninput="updateCharacter('skinColor', this.value)">
                        </div>

                        <div class="slider-container">
                            <label>Gesichtsform</label>
                            <input type="range" min="1" max="5" value="3" oninput="updateCharacter('face', this.value)">
                        </div>

                        <div class="option-container">
                            <label>Haarfarbe</label>
                            <input type="color" class="color-picker" value="#4a2f28" oninput="updateCharacter('hairColor', this.value)">
                        </div>

                        <div class="slider-container">
                            <label>Frisur</label>
                            <input type="range" min="1" max="10" value="1" oninput="updateCharacter('hairStyle', this.value)">
                        </div>

                        <div class="slider-container">
                            <label>Augenform</label>
                            <input type="range" min="1" max="5" value="3" oninput="updateCharacter('eyes', this.value)">
                        </div>

                        <div class="option-container">
                            <label>Augenfarbe</label>
                            <input type="color" class="color-picker" value="#4a2f28" oninput="updateCharacter('eyeColor', this.value)">
                        </div>

                        <div class="slider-container">
                            <label>Mundform</label>
                            <input type="range" min="1" max="5" value="3" oninput="updateCharacter('mouth', this.value)">
                        </div>

                        <input type="text" id="name-input" placeholder="Charaktername" maxlength="20">

                        <button id="confirm-button" onclick="confirmCharacter()">Charakter erstellen</button>
                    </div>
                </div>
                <script>
                    // Telegram WebApp initialisieren
                    const webapp = window.Telegram.WebApp;
                    webapp.expand();

                    // Three.js Setup
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, 70 * window.innerWidth / (100 * window.innerHeight), 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(0.7 * window.innerWidth, window.innerHeight);
                    document.getElementById('character-view').appendChild(renderer.domElement);

                    // Charakter-Daten
                    let characterData = {
                        gender: 'male',
                        height: 175,
                        build: 50,
                        skinColor: '#ffdbac',
                        face: 3,
                        hairColor: '#4a2f28',
                        hairStyle: 1,
                        eyes: 3,
                        eyeColor: '#4a2f28',
                        mouth: 3,
                        name: ''
                    };

                    // Basis-Charakter erstellen
                    function createCharacterMesh() {
                        // Körper
                        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
                        const bodyMaterial = new THREE.MeshStandardMaterial({ color: characterData.skinColor });
                        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                        
                        // Kopf
                        const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
                        const headMaterial = new THREE.MeshStandardMaterial({ color: characterData.skinColor });
                        const head = new THREE.Mesh(headGeometry, headMaterial);
                        head.position.y = 1.2;

                        // Haare
                        const hairGeometry = new THREE.SphereGeometry(0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
                        const hairMaterial = new THREE.MeshStandardMaterial({ color: characterData.hairColor });
                        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
                        hair.position.y = 1.4;

                        const character = new THREE.Group();
                        character.add(body);
                        character.add(head);
                        character.add(hair);
                        return character;
                    }

                    // Charakter initialisieren
                    let character = createCharacterMesh();
                    scene.add(character);

                    // Licht
                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                    scene.add(ambientLight);
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                    directionalLight.position.set(5, 5, 5);
                    scene.add(directionalLight);

                    // Kamera-Position
                    camera.position.z = 5;
                    camera.position.y = 1;

                    // Animation
                    function animate() {
                        requestAnimationFrame(animate);
                        character.rotation.y += 0.01;
                        renderer.render(scene, camera);
                    }
                    animate();

                    // Charakter aktualisieren
                    function updateCharacter(property, value) {
                        characterData[property] = value;
                        
                        // Werte-Anzeige aktualisieren
                        const slider = document.querySelector(\`input[oninput="updateCharacter('\${property}', this.value)"]\`);
                        if (slider) {
                            const valueDisplay = slider.nextElementSibling;
                            if (valueDisplay) {
                                if (property === 'height') {
                                    valueDisplay.textContent = \`\${value} cm\`;
                                } else if (property === 'build') {
                                    const builds = ['Sehr schlank', 'Schlank', 'Normal', 'Kräftig', 'Sehr kräftig'];
                                    valueDisplay.textContent = builds[Math.floor(value / 20)];
                                }
                            }
                        }

                        // 3D-Modell aktualisieren
                        scene.remove(character);
                        character = createCharacterMesh();
                        scene.add(character);
                    }

                    // Geschlecht auswählen
                    function selectGender(gender) {
                        characterData.gender = gender;
                        document.querySelectorAll('.gender-button').forEach(button => {
                            button.classList.remove('selected');
                        });
                        document.querySelector(\`[onclick="selectGender('\${gender}')"]\`).classList.add('selected');
                        updateCharacter('gender', gender);
                    }

                    // Charakter bestätigen
                    async function confirmCharacter() {
                        const name = document.getElementById('name-input').value.trim();
                        if (!name) {
                            alert('Bitte gib deinem Charakter einen Namen!');
                            return;
                        }
                        characterData.name = name;

                        try {
                            // Sende Charakterdaten an den Server
                            const response = await fetch('/api/character', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    userId: webapp.initDataUnsafe?.user?.id,
                                    character: characterData
                                })
                            });

                            if (response.ok) {
                                // Sende Bestätigung an Telegram
                                webapp.sendData(JSON.stringify({
                                    event: 'character_created',
                                    character: characterData
                                }));
                            } else {
                                throw new Error('Fehler beim Speichern des Charakters');
                            }
                        } catch (error) {
                            console.error('Fehler:', error);
                            alert('Fehler beim Erstellen des Charakters. Bitte versuche es erneut.');
                        }
                    }

                    // Fenster-Größenänderung
                    window.addEventListener('resize', () => {
                        camera.aspect = 0.7 * window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(0.7 * window.innerWidth, window.innerHeight);
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Fehler beim Rendern der Game-Seite:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// Telegram Bot
let bot: TelegramBot | null = null;

function initializeBot() {
    try {
        if (bot) {
            bot.stopPolling();
            bot = null;
        }

        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
            polling: true,
            // Polling-Optionen für bessere Stabilität
            polling_interval: 300,
            timeout: 10
        });

        // Error Handler für Polling-Fehler
        bot.on('polling_error', (error) => {
            if (error.code === 'ETELEGRAM' && error.message.includes('terminated by other getUpdates')) {
                console.log('Bot-Instanz wurde durch eine andere ersetzt. Starte neu...');
                setTimeout(initializeBot, 1000);
                return;
            }
            console.error('Polling-Fehler:', error);
        });

        // Bot-Befehle
        bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id.toString();

            if (!userId) {
                bot?.sendMessage(chatId, 'Fehler: Benutzer-ID nicht gefunden');
                return;
            }

            try {
                // Prüfen, ob bereits ein Charakter existiert
                const response = await fetch(`${process.env.BASE_URL}/api/character/${userId}`);
                
                if (response.ok) {
                    // Charakter existiert bereits
                    bot?.sendMessage(chatId, 'Willkommen zurück! Dein Charakter ist bereits erstellt.');
                } else {
                    // Neuer Spieler - Charaktererstellung starten
                    const gameUrl = `${process.env.BASE_URL}/game`;
                    bot?.sendMessage(chatId, 
                        'Willkommen bei G4NG MMO! Lass uns deinen Charakter erstellen.',
                        {
                            reply_markup: {
                                inline_keyboard: [[
                                    {
                                        text: 'Charakter erstellen',
                                        web_app: { url: gameUrl }
                                    }
                                ]]
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Fehler beim Prüfen des Charakters:', error);
                bot?.sendMessage(chatId, 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
            }
        });

        console.log('Bot erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler beim Initialisieren des Bots:', error);
        // Versuche nach 5 Sekunden erneut zu initialisieren
        setTimeout(initializeBot, 5000);
    }
}

// Initialisiere den Bot
initializeBot();

// Prozess-Beendigung behandeln
process.on('SIGTERM', () => {
    console.log('SIGTERM Signal empfangen. Beende Bot...');
    if (bot) {
        bot.stopPolling();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT Signal empfangen. Beende Bot...');
    if (bot) {
        bot.stopPolling();
    }
    process.exit(0);
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
}); 