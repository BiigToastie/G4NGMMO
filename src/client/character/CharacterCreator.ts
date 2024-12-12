import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer, 
    AmbientLight, 
    DirectionalLight,
    Color,
    LoadingManager,
    Group,
    Material,
    TextureLoader,
    AnimationMixer,
    AnimationAction,
    Clock,
    Box3,
    Vector3,
    Mesh,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    LinearFilter,
    LoopRepeat
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import WebApp from '@twa-dev/sdk';
import { ResourceManager } from '../ResourceManager';

interface CharacterData {
    name: string;
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

export class CharacterCreator {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private loadingManager: LoadingManager;
    private characterModel: Group | null = null;
    private textureLoader: TextureLoader;
    private materials: { [key: string]: Material } = {};
    private selectedGender: 'male' | 'female' = 'male';
    private selectedClass: string | null = null;
    private userName: string = '';
    private mixer: AnimationMixer | null = null;
    private currentAction: AnimationAction | null = null;
    private clock: Clock;
    private welcomeOverlay: HTMLElement;
    private acceptButton: HTMLElement;
    private playerName: string;

    constructor() {
        // Scene Setup
        this.scene = new Scene();
        this.scene.background = new Color(0x18222d);

        // Clock für Animationen
        this.clock = new Clock();

        // Camera Setup
        this.camera = new PerspectiveCamera(
            45,
            window.innerWidth / (window.innerHeight * 0.3),
            0.1,
            1000
        );
        this.camera.position.set(0, 2.2, 2.5);
        this.camera.lookAt(0, 1.5, 0);

        // Renderer Setup
        const canvas = document.getElementById('character-canvas') as HTMLCanvasElement;
        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.3);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 3;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.target.set(0, 1.5, 0);
        this.controls.update();

        // Loading Manager
        this.loadingManager = new LoadingManager();
        this.setupLoadingManager();

        // Texture Loader
        this.textureLoader = new TextureLoader(this.loadingManager);

        // Lighting Setup
        this.setupLighting();

        // Event Listeners
        this.setupEventListeners();

        // Get Telegram username
        this.getUserName();

        // Preload all resources
        ResourceManager.getInstance().preloadAllResources().then(() => {
            // Initial Load after resources are preloaded
            this.loadCharacterModel();
        });

        // Animation Loop
        this.animate();

        this.welcomeOverlay = document.getElementById('welcome-overlay')!;
        this.acceptButton = document.getElementById('accept-button')!;
        
        // Extrahiere den Spielernamen und userId aus den Telegram-Daten
        const initData = WebApp.initData || '';
        const initDataObj = Object.fromEntries(new URLSearchParams(initData));
        this.playerName = initDataObj.user ? JSON.parse(initDataObj.user).first_name : 'Unbekannter Held';
        const userId = initDataObj.user ? JSON.parse(initDataObj.user).id : null;

        // Initialisiere die Willkommensansicht
        this.setupWelcomeScreen(userId);
    }

    private getUserName(): void {
        // Telegram WebApp API
        if ((window as any).Telegram?.WebApp) {
            const webApp = (window as any).Telegram.WebApp;
            this.userName = webApp.initDataUnsafe?.user?.username || 'Spieler';
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = this.userName;
            }
        }
    }

    private setupLighting(): void {
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const keyLight = new DirectionalLight(0xffffff, 1);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        const fillLight = new DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 2, 0);
        this.scene.add(fillLight);

        const backLight = new DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 2, -2);
        this.scene.add(backLight);
    }

    private setupLoadingManager(): void {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        this.loadingManager.onStart = () => {
            if (loadingOverlay) loadingOverlay.style.display = 'flex';
        };

        this.loadingManager.onLoad = () => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };
    }

    private async loadCharacterModel(): Promise<void> {
        const modelPath = this.selectedGender === 'male' 
            ? '/models/male_all/Animation_Mirror_Viewing_withSkin.glb' 
            : '/models/female_all/Animation_Mirror_Viewing_withSkin.glb';
        
        console.log('=== Starte Charaktermodell-Laden ===');
        console.log('Details:', {
            geschlecht: this.selectedGender,
            pfad: modelPath,
            existingModel: !!this.characterModel,
            absoluterPfad: window.location.origin + modelPath
        });
        
        // Zeige Lade-Overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        try {
            // Prüfe ob die Datei existiert
            try {
                const response = await fetch(modelPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('Modelldatei existiert und ist zugänglich');
            } catch (error) {
                console.error('Fehler beim Prüfen der Modelldatei:', error);
                throw new Error(`Modelldatei nicht gefunden: ${modelPath}`);
            }

            // Entferne zuerst das alte Modell und seine Animationen
            if (this.characterModel) {
                console.log('Entferne altes Modell');
                if (this.mixer) {
                    this.mixer.stopAllAction();
                    this.mixer.uncacheRoot(this.characterModel);
                }
                this.scene.remove(this.characterModel);
                this.characterModel = null;
                this.mixer = null;
                this.currentAction = null;
            }

            console.log('Lade neues Modell von:', modelPath);
            const gltf = await ResourceManager.getInstance().getModel(modelPath);
            console.log('Modell-Daten:', {
                vorhanden: !!gltf,
                szeneVorhanden: !!gltf?.scene,
                animationen: gltf?.animations?.length || 0,
                szeneKinder: gltf?.scene?.children?.length || 0
            });

            if (!gltf || !gltf.scene) {
                throw new Error('Geladenes Modell ist ungültig');
            }

            this.characterModel = gltf.scene.clone();
            console.log('Modell geklont:', {
                vorhanden: !!this.characterModel,
                kinderAnzahl: this.characterModel?.children?.length || 0
            });
            
            if (this.characterModel) {
                console.log('Konfiguriere Modell');
                
                // Optimiere Materialien und Texturen
                let meshCount = 0;
                this.characterModel.traverse((child) => {
                    if (child instanceof Mesh) {
                        meshCount++;
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            const material = child.material as MeshStandardMaterial;
                            if (material.map) {
                                material.map.minFilter = LinearFilter;
                                material.map.magFilter = LinearFilter;
                                material.map.anisotropy = 1;
                            }
                            material.envMapIntensity = 0;
                            material.needsUpdate = true;
                        }
                    }
                });
                console.log(`Gefundene Meshes: ${meshCount}`);

                // Position und Skalierung anpassen
                this.characterModel.scale.set(1, 1, 1);
                this.characterModel.position.set(0, 0.8, 0);

                // Berechne Bounding Box für automatische Positionierung
                const box = new Box3().setFromObject(this.characterModel);
                const center = box.getCenter(new Vector3());
                const size = box.getSize(new Vector3());
                console.log('Modell-Dimensionen:', {
                    größe: size,
                    zentrum: center
                });

                // Zentriere das Modell
                this.characterModel.position.y = -center.y + size.y / 2 + 0.8;

                // Füge das Modell zur Szene hinzu
                this.scene.add(this.characterModel);
                console.log('Modell zur Szene hinzugefügt');

                // Animation Setup
                if (gltf.animations && gltf.animations.length > 0) {
                    console.log('Verfügbare Animationen:', gltf.animations.map(a => a.name));
                    
                    this.mixer = new AnimationMixer(this.characterModel);
                    const action = this.mixer.clipAction(gltf.animations[0]);
                    action.clampWhenFinished = true;
                    action.setLoop(LoopRepeat, Infinity);
                    action.play();
                    this.currentAction = action;
                    console.log('Animation gestartet:', gltf.animations[0].name);
                } else {
                    console.warn('Keine Animationen im Modell gefunden');
                }

                // Geschlechtsspezifische Anpassungen
                if (this.selectedGender === 'male') {
                    console.log('Männliche Modellanpassungen');
                    this.characterModel.rotation.y = Math.PI; // Drehe um 180 Grad
                }

                // Verstecke Lade-Overlay
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            } else {
                throw new Error('Charaktermodell konnte nicht erstellt werden');
            }
        } catch (error) {
            console.error('Fehler beim Laden des Modells:', error);
            // Verstecke Lade-Overlay auch im Fehlerfall
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            throw error;
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Gender Selection
        document.querySelectorAll('.selection-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const gender = target.getAttribute('data-gender') as 'male' | 'female';
                if (gender) {
                    console.log('Geschlechterwechsel angefordert:', gender);
                    this.selectedGender = gender;
                    
                    // UI aktualisieren
                    document.querySelectorAll('.selection-button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    target.classList.add('selected');
                    
                    try {
                        await this.loadCharacterModel();
                    } catch (error) {
                        console.error('Fehler beim Laden des Charaktermodells:', error);
                    }
                }
            });
        });

        // Class Selection
        document.querySelectorAll('.class-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const classButton = target.closest('.class-button') as HTMLElement;
                if (classButton) {
                    const characterClass = classButton.getAttribute('data-class');
                    if (characterClass) {
                        this.selectedClass = characterClass;
                        document.querySelectorAll('.class-button').forEach(btn => {
                            btn.classList.remove('selected');
                        });
                        classButton.classList.add('selected');
                        this.updateConfirmButton();
                    }
                }
            });
        });

        // Confirm Button
        document.getElementById('confirm-button')?.addEventListener('click', () => {
            this.saveCharacter();
        });
    }

    private updateConfirmButton(): void {
        const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement;
        if (confirmButton) {
            confirmButton.disabled = !this.selectedClass;
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / (window.innerHeight * 0.3);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.3);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        // Update Animationen
        const delta = this.clock.getDelta();
        if (this.mixer) {
            this.mixer.update(delta);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private saveCharacter(): void {
        if (!this.selectedClass) return;

        const characterData: CharacterData = {
            name: this.userName,
            gender: this.selectedGender,
            class: this.selectedClass as 'warrior' | 'mage' | 'ranger' | 'rogue'
        };

        localStorage.setItem('characterData', JSON.stringify(characterData));
        
        fetch('/api/character/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(characterData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/game.html';
            } else {
                alert('Fehler beim Speichern des Charakters: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Fehler beim Speichern des Charakters');
        });
    }

    private async setupWelcomeScreen(userId: string | null): Promise<void> {
        if (!userId) {
            console.error('Kein Benutzer-ID gefunden');
            return;
        }

        try {
            // Prüfe ob der Benutzer bereits einen Charakter hat
            const response = await fetch(`/api/character/${userId}`);
            const data = await response.json();

            if (data.character) {
                // Wenn ein Charakter existiert, überspringe das Willkommensfenster
                this.welcomeOverlay.style.display = 'none';
                this.initializeCharacterCreation();
            } else {
                // Zeige den Spielernamen im Willkommenstext
                const welcomeTitle = document.querySelector('.welcome-title')!;
                welcomeTitle.textContent = `Willkommen, ${this.playerName}!`;

                // Event-Listener für den Accept-Button
                this.acceptButton.addEventListener('click', () => {
                    // Blende das Overlay sanft aus
                    this.welcomeOverlay.style.opacity = '0';
                    setTimeout(() => {
                        this.welcomeOverlay.style.display = 'none';
                        // Initialisiere die Charaktererstellung
                        this.initializeCharacterCreation();
                    }, 500);
                });

                // Zeige das Overlay
                this.welcomeOverlay.style.display = 'flex';
                this.welcomeOverlay.style.opacity = '1';
            }
        } catch (error) {
            console.error('Fehler beim Prüfen des Charakterstatus:', error);
            // Im Fehlerfall zeigen wir das Willkommensfenster sicherheitshalber an
            this.welcomeOverlay.style.display = 'flex';
            this.welcomeOverlay.style.opacity = '1';
        }
    }

    private initializeCharacterCreation(): void {
        // Aktualisiere den Spielernamen im UI
        const nameInput = document.getElementById('character-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = this.playerName;
        }
        
        // ... rest of initialization code ...
    }
}

// Initialisiere den CharacterCreator
window.addEventListener('DOMContentLoaded', () => {
    new CharacterCreator();
}); 