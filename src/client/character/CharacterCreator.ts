import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import WebApp from '@twa-dev/sdk';

interface CharacterModel {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    animation: THREE.AnimationAction | null;
}

interface CharacterSelection {
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

export class CharacterCreator {
    private static instance: CharacterCreator | null = null;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly renderer: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private readonly loader: GLTFLoader;
    private readonly clock: THREE.Clock;
    private container: HTMLElement | null = null;
    private maleModel: CharacterModel | null = null;
    private femaleModel: CharacterModel | null = null;
    private selectedGender: 'male' | 'female' = 'male';

    private constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true
        });
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
        this.scene.background = new THREE.Color(0x17212b);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
        frontLight.position.set(0, 2, 4);
        frontLight.castShadow = true;
        
        const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
        backLight.position.set(0, 2, -4);
        
        const leftLight = new THREE.DirectionalLight(0xffffff, 0.5);
        leftLight.position.set(-4, 2, 0);
        
        const rightLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rightLight.position.set(4, 2, 0);
        
        this.scene.add(ambientLight, frontLight, backLight, leftLight, rightLight);

        this.camera.position.set(0, 1.6, 2.5);
        this.camera.lookAt(0, 1, 0);
    }

    public async initialize(): Promise<void> {
        try {
            const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
            debug('Initialisiere CharacterCreator...');
            
            this.container = document.getElementById('character-preview');
            if (!this.container) {
                throw new Error('Character preview container nicht gefunden');
            }

            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.setupControls();

            window.addEventListener('resize', this.onWindowResize.bind(this));

            await this.loadModels();
            this.animate();

            debug('CharacterCreator erfolgreich initialisiert');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (window.logDebug) {
                window.logDebug(`Fehler bei der CharacterCreator-Initialisierung: ${errorMsg}`);
            }
            throw error;
        }
    }

    private setupControls(): void {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 4;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.target.set(0, 1, 0);
        this.controls.update();
    }

    private async loadModels(): Promise<void> {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        try {
            debug('Lade Charaktermodelle...');
            const [maleGLTF, femaleGLTF] = await Promise.all([
                this.loadModel('male'),
                this.loadModel('female')
            ]);

            this.maleModel = await this.setupModel(maleGLTF, -1.2);
            this.femaleModel = await this.setupModel(femaleGLTF, 1.2);

            this.updateModelsVisibility();
            this.centerCameraOnModel(this.selectedGender === 'male' ? this.maleModel!.model : this.femaleModel!.model);

            debug('Modelle erfolgreich geladen');
        } catch (error) {
            debug(`Fehler beim Laden der Modelle: ${error}`);
            throw error;
        }
    }

    private async loadModel(gender: 'male' | 'female'): Promise<GLTF> {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        const path = `/models/${gender}_all/Animation_Mirror_Viewing_withSkin.glb`;
        debug(`Lade ${gender} Modell von ${path}...`);
        try {
            const gltf = await this.loader.loadAsync(path);
            debug(`${gender} Modell erfolgreich geladen`);
            debug(`Animationen gefunden: ${gltf.animations.length}`);
            gltf.animations.forEach((anim, index) => {
                debug(`Animation ${index}: ${anim.name}`);
            });
            return gltf;
        } catch (error) {
            debug(`Fehler beim Laden des Modells ${gender}: ${error}`);
            throw error;
        }
    }

    private async setupModel(gltf: GLTF, xPosition: number): Promise<CharacterModel> {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        const model = gltf.scene;
        
        model.position.set(xPosition, 0, 0);
        model.scale.set(1, 1, 1);
        model.rotation.y = Math.PI;
        
        model.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.SkinnedMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                if (object.material instanceof THREE.Material) {
                    object.material.needsUpdate = true;
                }
            }
        });

        const mixer = new THREE.AnimationMixer(model);
        let animation: THREE.AnimationAction | null = null;

        if (gltf.animations.length > 0) {
            debug('Verfügbare Animationen:');
            gltf.animations.forEach((anim, index) => {
                debug(`${index}: ${anim.name}`);
            });

            const idleAnimation = gltf.animations.find(anim => 
                anim.name.toLowerCase().includes('idle')
            ) || gltf.animations[0];
            
            animation = mixer.clipAction(idleAnimation);
            animation.play();
            debug(`Animation "${idleAnimation.name}" gestartet`);
        } else {
            debug('Keine Animationen im Modell gefunden');
        }

        this.scene.add(model);
        return { model, mixer, animation };
    }

    public setGender(gender: 'male' | 'female'): void {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        debug(`Setze Geschlecht auf: ${gender}`);
        this.selectedGender = gender;
        this.updateModelsVisibility();
    }

    private updateModelsVisibility(): void {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        debug('Aktualisiere Modell-Sichtbarkeit');
        if (this.maleModel) {
            this.maleModel.model.visible = this.selectedGender === 'male';
            if (this.selectedGender === 'male') {
                this.maleModel.mixer.stopAllAction();
                if (this.maleModel.animation) {
                    this.maleModel.animation.play();
                }
            }
        }

        if (this.femaleModel) {
            this.femaleModel.model.visible = this.selectedGender === 'female';
            if (this.selectedGender === 'female') {
                this.femaleModel.mixer.stopAllAction();
                if (this.femaleModel.animation) {
                    this.femaleModel.animation.play();
                }
            }
        }

        const activeModel = this.selectedGender === 'male' ? this.maleModel : this.femaleModel;
        if (activeModel) {
            this.centerCameraOnModel(activeModel.model);
        }
        
        debug(`Modell-Sichtbarkeit aktualisiert: ${this.selectedGender}`);
    }

    private centerCameraOnModel(model: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        this.camera.position.set(
            center.x,
            center.y + size.y / 3,
            center.z + cameraZ * 1.5
        );
        this.controls.target.set(center.x, center.y + size.y / 3, center.z);
        this.controls.update();
    }

    private onWindowResize(): void {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private animate(): void {
        const debug = (msg: string) => window.logDebug ? window.logDebug(msg) : console.log(msg);
        
        const animateFrame = () => {
            requestAnimationFrame(animateFrame);
            
            const delta = this.clock.getDelta();

            if (this.maleModel?.mixer) {
                this.maleModel.mixer.update(delta);
            }
            if (this.femaleModel?.mixer) {
                this.femaleModel.mixer.update(delta);
            }
            
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };

        debug('Animation-Loop gestartet');
        animateFrame();
    }

    public dispose(): void {
        this.disposeModel(this.maleModel);
        this.disposeModel(this.femaleModel);

        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
        this.controls.dispose();
    }

    private disposeModel(model: CharacterModel | null): void {
        if (!model) return;

        model.mixer.stopAllAction();
        this.scene.remove(model.model);
        model.model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Globale Typdeklaration
declare global {
    interface Window {
        CharacterCreator: typeof CharacterCreator;
        characterCreator: CharacterCreator | null;
        logDebug: (message: string) => void;
    }
}

// Explizite globale Zuweisung
window.CharacterCreator = CharacterCreator;
window.characterCreator = null;

export default CharacterCreator; 