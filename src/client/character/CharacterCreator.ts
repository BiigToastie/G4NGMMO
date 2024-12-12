import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    Vector3,
    AnimationMixer,
    Clock,
    Object3D,
    LoadingManager,
    Mesh,
    Material,
    Box3,
    Group,
    Color
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ResourceManager } from '../ResourceManager';
import { BaseCharacter } from './models/BaseCharacter';
import { MaleCharacter } from './models/MaleCharacter';
import { FemaleCharacter } from './models/FemaleCharacter';

export class CharacterCreator {
    private static instance: CharacterCreator | null = null;
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private controls!: OrbitControls;
    private clock: Clock;
    private mixer: AnimationMixer | null = null;
    private resourceManager: ResourceManager;
    private loadingManager: LoadingManager;
    private gltfLoader: GLTFLoader;
    private currentCharacter: BaseCharacter | null = null;
    private selectedGender: 'male' | 'female' = 'male';
    private isLoading: boolean = false;
    private canvas: HTMLCanvasElement;
    private initialized: boolean = false;
    private animationFrameId: number | null = null;

    private constructor() {
        console.log('CharacterCreator wird initialisiert...');
        
        // Canvas erstellen
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Scene Setup
        this.scene = new Scene();
        this.scene.background = new Color(0x87CEEB); // Hellblauer Himmel
        
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.clock = new Clock();
        
        // Resource Management
        this.loadingManager = new LoadingManager();
        this.setupLoadingManager();
        
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.resourceManager = ResourceManager.getInstance();
    }

    public static getInstance(): CharacterCreator {
        if (!CharacterCreator.instance) {
            CharacterCreator.instance = new CharacterCreator();
        }
        return CharacterCreator.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('CharacterCreator bereits initialisiert');
            return;
        }

        console.log('Initialisiere CharacterCreator...');

        // Füge Canvas zum Container hinzu
        const container = document.getElementById('canvas-container');
        if (!container) {
            throw new Error('Canvas-Container nicht gefunden');
        }
        container.appendChild(this.canvas);

        this.setupScene();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.startAnimation();

        // Zeige Lade-Overlay
        this.showLoadingOverlay();

        try {
            // Lade initial die Ressourcen
            console.log('Starte Ressourcen-Preload...');
            await this.resourceManager.preloadAllResources();
            
            console.log('Ressourcen erfolgreich geladen, lade initiales Modell...');
            await this.loadCharacterModel(this.selectedGender);
            
            console.log('Initiales Modell geladen');
            this.initialized = true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            this.showErrorMessage('Fehler bei der Initialisierung');
            throw error;
        } finally {
            this.hideLoadingOverlay();
        }
    }

    private startAnimation(): void {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            const delta = this.clock.getDelta();

            if (this.mixer) {
                this.mixer.update(delta);
            }

            if (this.controls) {
                this.controls.update();
            }

            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    private setupLoadingManager(): void {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Lade... ${Math.round(progress)}% (${itemsLoaded}/${itemsTotal})`);
            this.updateLoadingProgress(progress);
        };

        this.loadingManager.onLoad = () => {
            console.log('Alle Ressourcen geladen!');
            this.hideLoadingOverlay();
        };

        this.loadingManager.onError = (url) => {
            console.error('Fehler beim Laden:', url);
            this.showErrorMessage(`Fehler beim Laden von: ${url}`);
        };
    }

    private setupScene(): void {
        console.log('Richte Szene ein...');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 1.7, 3);
        this.camera.lookAt(0, 1.7, 0);
    }

    private setupLights(): void {
        // Ambient Light für Grundbeleuchtung
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Hauptlicht von vorne-oben
        const mainLight = new DirectionalLight(0xffffff, 1);
        mainLight.position.set(0, 5, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Füll-Licht von links
        const fillLight = new DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 2, 0);
        this.scene.add(fillLight);

        // Akzent-Licht von rechts-hinten
        const rimLight = new DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(5, 2, -5);
        this.scene.add(rimLight);
    }

    private setupControls(): void {
        console.log('Richte Kamera-Steuerung ein...');
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 1.7, 0);
        this.controls.update();
    }

    private setupEventListeners(): void {
        console.log('Richte Event-Listener ein...');
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Geschlechtsauswahl-Buttons
        const maleButton = document.getElementById('male-button');
        const femaleButton = document.getElementById('female-button');

        if (maleButton) {
            console.log('Male-Button gefunden, füge Event-Listener hinzu');
            maleButton.addEventListener('click', () => {
                console.log('Male-Button geklickt');
                if (!this.isLoading) {
                    this.switchCharacter('male');
                }
            });
        } else {
            console.warn('Male-Button nicht gefunden!');
        }

        if (femaleButton) {
            console.log('Female-Button gefunden, füge Event-Listener hinzu');
            femaleButton.addEventListener('click', () => {
                console.log('Female-Button geklickt');
                if (!this.isLoading) {
                    this.switchCharacter('female');
                }
            });
        } else {
            console.warn('Female-Button nicht gefunden!');
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private async loadCharacterModel(gender: 'male' | 'female'): Promise<void> {
        if (this.isLoading) {
            console.log('Modell wird bereits geladen, überspringe...');
            return;
        }

        this.isLoading = true;
        this.showLoadingOverlay();

        try {
            console.log(`Lade ${gender}-Charaktermodell...`);
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
                console.log('Entferne altes Modell');
                this.scene.remove(this.currentCharacter.getModel()!);
                this.currentCharacter.dispose();
            }

            // Erstelle den neuen Charakter basierend auf dem Geschlecht
            console.log('Erstelle neuen Charakter');
            this.currentCharacter = gender === 'male' 
                ? new MaleCharacter(this.gltfLoader)
                : new FemaleCharacter(this.gltfLoader);
            
            // Füge das neue Modell zur Szene hinzu
            console.log('Füge Modell zur Szene hinzu');
            const model = gltf.scene.clone(); // Clone das Modell
            this.scene.add(model);

            // Zentriere die Kamera auf das neue Modell
            this.centerCameraOnCharacter();

            console.log(`${gender}-Charakter erfolgreich geladen`);
            
            // Aktualisiere UI
            this.updateCharacterSelectionUI(gender);
        } catch (error) {
            console.error('Fehler beim Laden des Charaktermodells:', error);
            this.showErrorMessage('Fehler beim Laden des Charaktermodells');
            throw error;
        } finally {
            this.isLoading = false;
            this.hideLoadingOverlay();
        }
    }

    private centerCameraOnCharacter(): void {
        if (!this.currentCharacter || !this.currentCharacter.getModel()) return;

        const model = this.currentCharacter.getModel()!;
        const center = new Vector3();
        const size = new Vector3();

        // Berechne das Zentrum des Modells
        const box = new Box3().setFromObject(model);
        box.getCenter(center);
        box.getSize(size);

        // Setze die Kamera auf eine Position, die das gesamte Modell zeigt
        const distance = Math.max(size.x, size.y, size.z) * 2;
        this.camera.position.set(
            center.x + distance,
            center.y + distance / 2,
            center.z + distance
        );

        // Richte die Kamera auf das Zentrum des Modells
        this.camera.lookAt(center);
        this.controls.target.copy(center);
        this.controls.update();
    }

    public switchCharacter(gender: 'male' | 'female'): void {
        console.log(`Charakterwechsel zu ${gender} angefordert`);
        if (this.isLoading) {
            console.log('Charakterwechsel wird übersprungen, da bereits ein Ladevorgang läuft');
            return;
        }
        
        this.selectedGender = gender;
        this.loadCharacterModel(gender).catch(error => {
            console.error('Fehler beim Charakterwechsel:', error);
            this.showErrorMessage('Fehler beim Charakterwechsel');
        });
    }

    private updateCharacterSelectionUI(gender: 'male' | 'female'): void {
        const maleButton = document.getElementById('male-button');
        const femaleButton = document.getElementById('female-button');

        if (maleButton && femaleButton) {
            maleButton.classList.toggle('selected', gender === 'male');
            femaleButton.classList.toggle('selected', gender === 'female');
        }
    }

    private showLoadingOverlay(): void {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    private hideLoadingOverlay(): void {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    private updateLoadingProgress(progress: number): void {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    private showErrorMessage(message: string): void {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    public dispose(): void {
        console.log('Räume CharacterCreator auf...');
        
        // Stoppe Animation Loop
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Cleanup
        if (this.currentCharacter) {
            this.currentCharacter.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        this.scene.traverse((object: Object3D) => {
            if (object instanceof Mesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if ((object as Mesh).material) {
                    const material = (object as Mesh).material;
                    if (Array.isArray(material)) {
                        material.forEach((mat: Material) => mat.dispose());
                    } else {
                        material.dispose();
                    }
                }
            }
        });

        // Entferne Canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Entferne Event-Listener
        window.removeEventListener('resize', this.onWindowResize.bind(this));

        // Setze Instanz-Variablen zurück
        this.initialized = false;
        if (CharacterCreator.instance) {
            CharacterCreator.instance = null;
        }
    }
} 