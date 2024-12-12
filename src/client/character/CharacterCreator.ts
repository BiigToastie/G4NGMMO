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
    LoopRepeat,
    Object3D
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import WebApp from '@twa-dev/sdk';
import { ResourceManager } from '../ResourceManager';

interface CharacterData {
    name: string;
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

interface TelegramUser {
    first_name: string;
    id: string;
}

interface TelegramInitData {
    user?: TelegramUser;
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
        this.camera.position.set(0, 1.7, 3.0);
        this.camera.lookAt(0, 1.7, 0);

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
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = 4.0;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.target.set(0, 1.7, 0);
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
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');
        const user: TelegramUser | null = userStr ? JSON.parse(userStr) : null;
        
        this.playerName = user?.first_name || 'Unbekannter Held';
        const userId = user?.id || null;

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
        const ambientLight = new AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const keyLight = new DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        const fillLight = new DirectionalLight(0xffffff, 0.6);
        fillLight.position.set(-2, 1, 0);
        this.scene.add(fillLight);

        const backLight = new DirectionalLight(0xffffff, 0.6);
        backLight.position.set(0, 2, -2);
        this.scene.add(backLight);
    }

    private setupLoadingManager(): void {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        this.loadingManager.onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
            if (loadingOverlay) loadingOverlay.style.display = 'flex';
        };

        this.loadingManager.onLoad = () => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };

        this.loadingManager.onError = (url: string) => {
            console.error('Error loading:', url);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };
    }

    private async loadCharacterModel(gender: 'male' | 'female'): Promise<void> {
        try {
            const modelPath = gender === 'male' 
                ? '/models/male_all/Animation_Mirror_Viewing_withSkin.glb'
                : '/models/female_all/Animation_Mirror_Viewing_withSkin.glb';

            const modelKey = gender === 'male' ? 'maleCharacter' : 'femaleCharacter';
            const gltf = this.resourceManager.getResource(modelKey);

            if (!gltf) {
                throw new Error(`Model nicht gefunden: ${modelPath}`);
            }

            // Entferne das alte Modell, falls vorhanden
            if (this.currentCharacter) {
                this.scene.remove(this.currentCharacter.getModel()!);
                this.currentCharacter.dispose();
            }

            // Erstelle den neuen Charakter
            this.currentCharacter = new BaseCharacter(this.gltfLoader);
            
            // Füge das neue Modell zur Szene hinzu
            const model = gltf.scene;
            this.scene.add(model);

            // Zentriere die Kamera auf das neue Modell
            this.centerCameraOnCharacter();

            console.log(`${gender}-Charakter erfolgreich geladen`);
        } catch (error) {
            console.error('Fehler beim Laden des Charaktermodells:', error);
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
        
        // Aktualisiere die Kameraposition beim Resize
        this.camera.position.set(0, 1.7, 3.0);
        this.camera.lookAt(0, 1.7, 0);
        this.controls.target.set(0, 1.7, 0);
        this.controls.update();
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