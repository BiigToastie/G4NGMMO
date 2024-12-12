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
    LoadingManager
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ResourceManager } from '../ResourceManager';
import { BaseCharacter } from './models/BaseCharacter';

export class CharacterCreator {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private clock: Clock;
    private mixer: AnimationMixer | null = null;
    private resourceManager: ResourceManager;
    private loadingManager: LoadingManager;
    private gltfLoader: GLTFLoader;
    private currentCharacter: BaseCharacter | null = null;
    private selectedGender: 'male' | 'female' = 'male';

    constructor() {
        // Scene Setup
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true });
        this.clock = new Clock();
        
        // Resource Management
        this.loadingManager = new LoadingManager();
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.resourceManager = ResourceManager.getInstance();

        this.setupScene();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.animate();

        // Lade initial die Ressourcen
        this.resourceManager.preloadAllResources().then(() => {
            // Initial Load after resources are preloaded
            this.loadCharacterModel(this.selectedGender);
        });
    }

    private setupScene(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 1.7, 3);
        this.camera.lookAt(0, 1.7, 0);
    }

    private setupLights(): void {
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    }

    private setupControls(): void {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 2;
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Geschlechtsauswahl-Buttons
        const maleButton = document.getElementById('male-button');
        const femaleButton = document.getElementById('female-button');

        if (maleButton) {
            maleButton.addEventListener('click', () => {
                this.selectedGender = 'male';
                this.loadCharacterModel('male');
            });
        }

        if (femaleButton) {
            femaleButton.addEventListener('click', () => {
                this.selectedGender = 'female';
                this.loadCharacterModel('female');
            });
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
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

    private centerCameraOnCharacter(): void {
        if (!this.currentCharacter || !this.currentCharacter.getModel()) return;

        const model = this.currentCharacter.getModel()!;
        const center = new Vector3();
        const size = new Vector3();

        // Berechne das Zentrum des Modells
        const box = model.getBoundingBox();
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
    }

    public switchCharacter(gender: 'male' | 'female'): void {
        this.selectedGender = gender;
        this.loadCharacterModel(gender).catch(error => {
            console.error('Fehler beim Charakterwechsel:', error);
        });
    }

    public dispose(): void {
        // Cleanup
        if (this.currentCharacter) {
            this.currentCharacter.dispose();
        }
        this.renderer.dispose();
        this.scene.traverse((object: Object3D) => {
            if (object instanceof Mesh) {
                object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });
    }
} 