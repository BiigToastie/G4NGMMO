import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import WebApp from '@twa-dev/sdk';

interface CharacterSelection {
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

export class CharacterCreator {
    private static instance: CharacterCreator | null = null;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private loader: GLTFLoader;
    private animationMixer: THREE.AnimationMixer | null = null;
    private container: HTMLElement | null = null;
    private clock: THREE.Clock;
    private selectedCharacter: CharacterSelection = {
        gender: 'male',
        class: 'warrior'
    };
    private currentModel: THREE.Object3D | null = null;
    private maleModel: { model: THREE.Object3D, mixer: THREE.AnimationMixer } | null = null;
    private femaleModel: { model: THREE.Object3D, mixer: THREE.AnimationMixer } | null = null;
    private selectedGender: 'male' | 'female' = 'male';

    private constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.loader = new GLTFLoader();
        this.clock = new THREE.Clock();
        this.setupScene();
    }

    public static getInstance(): CharacterCreator {
        if (!CharacterCreator.instance) {
            CharacterCreator.instance = new CharacterCreator();
        }
        return CharacterCreator.instance;
    }

    private setupScene(): void {
        // Szene einrichten
        this.scene.background = new THREE.Color(0x17212b);

        // Beleuchtung
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, 5, -5);

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight3.position.set(0, -5, 5);
        
        this.scene.add(ambientLight, directionalLight, directionalLight2, directionalLight3);

        // Kamera-Position
        this.camera.position.set(0, 1.6, 4); // Weiter weg für bessere Übersicht
        this.camera.lookAt(0, 1, 0);

        // Controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.target.set(0, 1, 0);
    }

    public async initialize(): Promise<void> {
        try {
            console.log('Initialisiere CharacterCreator...');
            
            // Finde den Container
            this.container = document.getElementById('character-preview');
            if (!this.container) {
                throw new Error('Character preview container not found');
            }

            // Renderer-Setup
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);

            // Event Listener für Größenänderungen
            window.addEventListener('resize', this.onWindowResize.bind(this));

            // Event Listener für Charakterauswahl
            this.setupCharacterSelectionListeners();

            // Starte Animation Loop
            this.animate();

            // Lade initiales Modell (männlich)
            await this.updateCharacter('male');
            console.log('CharacterCreator erfolgreich initialisiert');

        } catch (error) {
            console.error('Fehler bei der CharacterCreator-Initialisierung:', error);
            throw error;
        }
    }

    private setupCharacterSelectionListeners(): void {
        // Geschlecht-Buttons
        const maleBtn = document.getElementById('male-btn');
        const femaleBtn = document.getElementById('female-btn');

        maleBtn?.addEventListener('click', () => {
            this.selectedCharacter.gender = 'male';
            this.updateButtonStates();
            this.updateCharacter('male');
        });

        femaleBtn?.addEventListener('click', () => {
            this.selectedCharacter.gender = 'female';
            this.updateButtonStates();
            this.updateCharacter('female');
        });

        // Klassen-Buttons
        const classes = ['warrior', 'mage', 'ranger', 'rogue'] as const;
        classes.forEach(className => {
            const btn = document.getElementById(`${className}-btn`);
            btn?.addEventListener('click', () => {
                this.selectedCharacter.class = className;
                this.updateButtonStates();
                this.updateCharacter(this.selectedCharacter.gender);
            });
        });

        // Speichern-Button
        const saveBtn = document.getElementById('save-character');
        saveBtn?.addEventListener('click', async () => {
            try {
                await this.saveCharacter();
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                this.showError('Fehler beim Speichern des Charakters');
            }
        });

        // Initiale Button-States
        this.updateButtonStates();
    }

    private updateButtonStates(): void {
        // Geschlecht-Buttons
        const maleBtn = document.getElementById('male-btn');
        const femaleBtn = document.getElementById('female-btn');
        
        maleBtn?.classList.toggle('selected', this.selectedCharacter.gender === 'male');
        femaleBtn?.classList.toggle('selected', this.selectedCharacter.gender === 'female');

        // Klassen-Buttons
        const classes = ['warrior', 'mage', 'ranger', 'rogue'] as const;
        classes.forEach(className => {
            const btn = document.getElementById(`${className}-btn`);
            btn?.classList.toggle('selected', this.selectedCharacter.class === className);
        });
    }

    private async saveCharacter(): Promise<void> {
        const response = await fetch('/api/character/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gender: this.selectedCharacter.gender,
                class: this.selectedCharacter.class
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Charakters');
        }

        // Schließe die WebApp nach erfolgreichem Speichern
        WebApp.close();
    }

    private showError(message: string): void {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }

    public async updateCharacter(gender: 'male' | 'female'): Promise<void> {
        try {
            console.log(`Lade ${gender} Charakter...`);

            // Entferne aktuelles Modell und Animation
            if (this.animationMixer) {
                this.animationMixer.stopAllAction();
            }

            if (this.currentModel) {
                this.scene.remove(this.currentModel);
                this.currentModel.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        if (object.geometry) object.geometry.dispose();
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

            // Lade neues Modell
            const modelPath = gender === 'male' 
                ? '/dist/models/male_all/Animation_Mirror_Viewing_withSkin.glb'
                : '/dist/models/female_all/Animation_Mirror_Viewing_withSkin.glb';

            console.log(`Lade Modell von: ${modelPath}`);
            
            const gltf = await this.loader.loadAsync(modelPath);
            this.currentModel = gltf.scene;

            // Modell-Setup
            this.currentModel.position.set(0, 0, 0);
            this.currentModel.traverse((object) => {
                if ('castShadow' in object) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });

            // Animation-Setup
            if (gltf.animations.length > 0) {
                this.animationMixer = new THREE.AnimationMixer(this.currentModel);
                const animation = gltf.animations[0]; // Mirror_Viewing Animation
                const action = this.animationMixer.clipAction(animation);
                action.play();
            }

            // Füge Modell zur Szene hinzu
            this.scene.add(this.currentModel);

            // Zentriere Kamera auf Modell
            const box = new THREE.Box3().setFromObject(this.currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            this.camera.position.set(
                center.x,
                center.y + size.y / 3,
                center.z + cameraZ * 1.5
            );
            this.controls.target.set(center.x, center.y + size.y / 3, center.z);
            this.controls.update();

            console.log(`${gender} Charakter erfolgreich geladen`);

        } catch (error) {
            console.error('Fehler beim Aktualisieren des Charakters:', error);
            throw error;
        }
    }

    private onWindowResize(): void {
        if (this.container) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update Animation
        const delta = this.clock.getDelta();
        if (this.animationMixer) {
            this.animationMixer.update(delta);
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
        }

        window.removeEventListener('resize', this.onWindowResize.bind(this));

        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        this.renderer.dispose();
        this.controls.dispose();
    }

    private async loadModels(): Promise<void> {
        try {
            // Lade männliches Modell
            console.log('Lade männliches Modell...');
            const maleGLTF = await this.loader.loadAsync('/dist/models/male_all/Animation_Mirror_Viewing_withSkin.glb');
            const maleModel = maleGLTF.scene;
            maleModel.position.set(-1.2, 0, 0);
            maleModel.traverse((object) => {
                if (object instanceof THREE.SkinnedMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    // Behalte das originale Material bei
                    const originalMaterial = object.material;
                    if (originalMaterial instanceof THREE.Material) {
                        originalMaterial.needsUpdate = true;
                    }
                }
            });
            const maleMixer = new THREE.AnimationMixer(maleModel);
            if (maleGLTF.animations.length > 0) {
                console.log('Männliche Animationen gefunden:', maleGLTF.animations.length);
                const action = maleMixer.clipAction(maleGLTF.animations[0]);
                action.play();
            }
            this.maleModel = { model: maleModel, mixer: maleMixer };
            this.scene.add(maleModel);
            console.log('Männliches Modell geladen und zur Szene hinzugefügt');

            // Lade weibliches Modell
            console.log('Lade weibliches Modell...');
            const femaleGLTF = await this.loader.loadAsync('/dist/models/female_all/Animation_Mirror_Viewing_withSkin.glb');
            const femaleModel = femaleGLTF.scene;
            femaleModel.position.set(1.2, 0, 0);
            femaleModel.traverse((object) => {
                if (object instanceof THREE.SkinnedMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    // Behalte das originale Material bei
                    const originalMaterial = object.material;
                    if (originalMaterial instanceof THREE.Material) {
                        originalMaterial.needsUpdate = true;
                    }
                }
            });
            const femaleMixer = new THREE.AnimationMixer(femaleModel);
            if (femaleGLTF.animations.length > 0) {
                console.log('Weibliche Animationen gefunden:', femaleGLTF.animations.length);
                const action = femaleMixer.clipAction(femaleGLTF.animations[0]);
                action.play();
            }
            this.femaleModel = { model: femaleModel, mixer: femaleMixer };
            this.scene.add(femaleModel);
            console.log('Weibliches Modell geladen und zur Szene hinzugefügt');

            // Setze initiale Hervorhebung
            this.updateModelsHighlight();

            // Zentriere Kamera auf beide Modelle
            this.centerCameraOnModels();

            console.log('Beide Modelle erfolgreich geladen');

        } catch (error) {
            console.error('Fehler beim Laden der Modelle:', error);
            throw error;
        }
    }

    public setGender(gender: 'male' | 'female'): void {
        this.selectedGender = gender;
        this.updateModelsHighlight();
    }

    private updateModelsHighlight(): void {
        const createMaterial = (isSelected: boolean, originalMaterial: THREE.Material) => {
            // Kopiere die Eigenschaften des originalen Materials
            const material = originalMaterial.clone();
            // Passe nur die Helligkeit an
            material.opacity = isSelected ? 1.0 : 0.7;
            material.transparent = !isSelected;
            material.needsUpdate = true;
            return material;
        };

        if (this.maleModel) {
            this.maleModel.model.traverse((object) => {
                if (object instanceof THREE.SkinnedMesh && object.material) {
                    const originalMaterial = object.material;
                    object.material = createMaterial(this.selectedGender === 'male', originalMaterial);
                }
            });
        }

        if (this.femaleModel) {
            this.femaleModel.model.traverse((object) => {
                if (object instanceof THREE.SkinnedMesh && object.material) {
                    const originalMaterial = object.material;
                    object.material = createMaterial(this.selectedGender === 'female', originalMaterial);
                }
            });
        }
    }

    private centerCameraOnModels(): void {
        if (this.maleModel && this.femaleModel) {
            const maleBox = new THREE.Box3().setFromObject(this.maleModel.model);
            const femaleBox = new THREE.Box3().setFromObject(this.femaleModel.model);
            const unionBox = new THREE.Box3().union(maleBox, femaleBox);
            const center = unionBox.getCenter(new THREE.Vector3());
            const size = unionBox.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            this.camera.position.set(
                center.x,
                center.y + size.y / 3,
                center.z + cameraZ * 1.5
            );
            this.controls.target.set(center.x, center.y + size.y / 3, center.z);
            this.controls.update();
        }
    }
} 