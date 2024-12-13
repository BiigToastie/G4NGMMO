import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MaleCharacter } from './models/MaleCharacter';
import { FemaleCharacter } from './models/FemaleCharacter';
import { BaseCharacter } from './models/BaseCharacter';

export class CharacterCreator {
    private static instance: CharacterCreator | null = null;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private currentCharacter: BaseCharacter | null = null;
    private loader: GLTFLoader;
    private animationFrameId: number | null = null;
    private container: HTMLElement | null = null;

    private constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.loader = new GLTFLoader();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
        this.scene.background = new THREE.Color(0x232e3c);

        // Beleuchtung
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(ambientLight, directionalLight);

        // Kamera-Position
        this.camera.position.set(0, 1.6, 2);
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

            // Starte Animation
            this.animate();

            // Lade initiales Modell
            await this.updateCharacter('male', 'warrior');

        } catch (error) {
            console.error('Fehler bei der CharacterCreator-Initialisierung:', error);
            throw error;
        }
    }

    public async updateCharacter(gender: 'male' | 'female', characterClass: string): Promise<void> {
        try {
            // Entferne aktuelles Modell
            if (this.currentCharacter) {
                const model = this.currentCharacter.getModel();
                if (model) {
                    this.scene.remove(model);
                }
                this.currentCharacter.dispose();
            }

            // Erstelle neues Modell
            this.currentCharacter = gender === 'male' 
                ? new MaleCharacter(this.loader)
                : new FemaleCharacter(this.loader);

            // Lade und füge das Modell hinzu
            const model = await this.currentCharacter.load();
            if (model) {
                model.position.set(0, 0, 0);
                this.scene.add(model);
                
                // Zentriere Kamera auf Modell
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = this.camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                
                this.camera.position.set(center.x, center.y + size.y / 3, center.z + cameraZ * 1.5);
                this.controls.target.set(center.x, center.y + size.y / 3, center.z);
                this.controls.update();
            }

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
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.currentCharacter) {
            const mixer = this.currentCharacter.getMixer();
            if (mixer) {
                mixer.update(0.016); // ~60fps
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.currentCharacter) {
            this.currentCharacter.dispose();
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
} 