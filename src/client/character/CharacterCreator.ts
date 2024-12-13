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
        this.scene.background = new THREE.Color(0x17212b);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, 5, -5);

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight3.position.set(0, -5, 5);
        
        this.scene.add(ambientLight, directionalLight, directionalLight2, directionalLight3);

        this.camera.position.set(0, 1.6, 4);
        this.camera.lookAt(0, 1, 0);
    }

    public async initialize(): Promise<void> {
        try {
            console.log('Initialisiere CharacterCreator...');
            
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

            console.log('CharacterCreator erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der CharacterCreator-Initialisierung:', error);
            throw error;
        }
    }

    private setupControls(): void {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.target.set(0, 1, 0);
    }

    private async loadModels(): Promise<void> {
        try {
            const [maleGLTF, femaleGLTF] = await Promise.all([
                this.loadModel('male'),
                this.loadModel('female')
            ]);

            this.maleModel = await this.setupModel(maleGLTF, -1.2);
            this.femaleModel = await this.setupModel(femaleGLTF, 1.2);

            this.updateModelsVisibility();
            this.centerCameraOnModel(this.selectedGender === 'male' ? this.maleModel!.model : this.femaleModel!.model);

            console.log('Beide Modelle erfolgreich geladen');
        } catch (error) {
            console.error('Fehler beim Laden der Modelle:', error);
            throw error;
        }
    }

    private async loadModel(gender: 'male' | 'female'): Promise<GLTF> {
        const path = `/dist/models/${gender}_all/Animation_Mirror_Viewing_withSkin.glb`;
        console.log(`Lade ${gender} Modell von ${path}...`);
        return await this.loader.loadAsync(path);
    }

    private async setupModel(gltf: GLTF, xPosition: number): Promise<CharacterModel> {
        const model = gltf.scene;
        model.position.set(xPosition, 0, 0);
        
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
            animation = mixer.clipAction(gltf.animations[0]);
            animation.play();
        }

        this.scene.add(model);
        return { model, mixer, animation };
    }

    public setGender(gender: 'male' | 'female'): void {
        this.selectedGender = gender;
        this.updateModelsVisibility();
    }

    private updateModelsVisibility(): void {
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
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();

        if (this.maleModel?.mixer) {
            this.maleModel.mixer.update(delta);
        }
        if (this.femaleModel?.mixer) {
            this.femaleModel.mixer.update(delta);
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
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