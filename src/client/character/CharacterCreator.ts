import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CharacterCreator {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loadingManager: THREE.LoadingManager;
    private characterModel: THREE.Group | null = null;
    private textureLoader: THREE.TextureLoader;

    constructor() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / (window.innerHeight * 0.6),
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 2);

        // Renderer Setup
        const canvas = document.getElementById('character-canvas') as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 4;
        this.controls.target.set(0, 1.7, 0);

        // Loading Manager
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();

        // Texture Loader
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);

        // Lighting Setup
        this.setupLighting();

        // Event Listeners
        this.setupEventListeners();

        // Initial Load
        this.loadCharacterModel();

        // Animation Loop
        this.animate();
    }

    private setupLighting(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 2, 2);
        this.scene.add(frontLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
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

    private loadCharacterModel(): void {
        const loader = new GLTFLoader(this.loadingManager);
        
        // Lade die Basis-Textur
        const baseTexture = this.textureLoader.load('/models/textures/base_texture.png');
        baseTexture.flipY = false; // Wichtig für GLTF
        
        loader.load('/models/character.gltf', (gltf) => {
            if (this.characterModel) {
                this.scene.remove(this.characterModel);
            }

            this.characterModel = gltf.scene;
            
            if (this.characterModel) {
                // Wende die Textur auf alle Mesh-Materialien an
                this.characterModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const material = child.material as THREE.MeshStandardMaterial;
                        material.map = baseTexture;
                        material.needsUpdate = true;
                    }
                });

                this.characterModel.scale.set(1, 1, 1);
                this.characterModel.position.set(0, 0, 0);
                this.scene.add(this.characterModel);

                // Debug Helper
                const box = new THREE.Box3().setFromObject(this.characterModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                console.log('Model loaded:', {
                    position: this.characterModel.position,
                    scale: this.characterModel.scale,
                    center: center,
                    size: size
                });

                // Apply initial settings
                this.updateCharacterHeight(175);
                this.updateSkinColor('#f4d03f');
                this.updateHairColor('#3d2314');
            }
        }, 
        (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading model:', error);
        });
    }

    private updateCharacterHeight(height: number): void {
        if (this.characterModel) {
            const scale = height / 175;
            this.characterModel.scale.setY(scale);
        }
    }

    private updateBodyType(bodyType: string): void {
        if (this.characterModel) {
            switch (bodyType) {
                case 'slim':
                    this.characterModel.scale.setX(0.9);
                    this.characterModel.scale.setZ(0.9);
                    break;
                case 'average':
                    this.characterModel.scale.setX(1.0);
                    this.characterModel.scale.setZ(1.0);
                    break;
                case 'athletic':
                    this.characterModel.scale.setX(1.1);
                    this.characterModel.scale.setZ(1.1);
                    break;
            }
        }
    }

    private updateSkinColor(color: string): void {
        if (this.characterModel) {
            const newColor = new THREE.Color(color);
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (child.name.toLowerCase().includes('skin')) {
                        material.color = newColor;
                        material.needsUpdate = true;
                    }
                }
            });
        }
    }

    private updateHairColor(color: string): void {
        if (this.characterModel) {
            const newColor = new THREE.Color(color);
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (child.name.toLowerCase().includes('hair')) {
                        material.color = newColor;
                        material.needsUpdate = true;
                    }
                }
            });
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // UI Controls
        document.getElementById('character-height')?.addEventListener('input', (e) => {
            const height = (e.target as HTMLInputElement).value;
            const heightValue = document.getElementById('height-value');
            if (heightValue) {
                heightValue.textContent = `${height} cm`;
            }
            this.updateCharacterHeight(parseFloat(height));
        });

        document.getElementById('body-type')?.addEventListener('change', (e) => {
            const bodyType = (e.target as HTMLSelectElement).value;
            this.updateBodyType(bodyType);
        });

        document.getElementById('skin-color')?.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.updateSkinColor(color);
        });

        document.getElementById('hair-color')?.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.updateHairColor(color);
        });

        document.getElementById('confirm-button')?.addEventListener('click', () => {
            this.saveCharacter();
        });
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / (window.innerHeight * 0.6);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private saveCharacter(): void {
        const characterData = {
            name: (document.getElementById('character-name') as HTMLInputElement)?.value || '',
            gender: (document.getElementById('character-gender') as HTMLSelectElement)?.value || 'male',
            height: (document.getElementById('character-height') as HTMLInputElement)?.value || '175',
            bodyType: (document.getElementById('body-type') as HTMLSelectElement)?.value || 'average',
            skinColor: (document.getElementById('skin-color') as HTMLInputElement)?.value || '#f4d03f',
            hairStyle: (document.getElementById('hair-style') as HTMLSelectElement)?.value || 'kurz',
            hairColor: (document.getElementById('hair-color') as HTMLInputElement)?.value || '#3d2314',
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
}

// Initialisiere den CharacterCreator
window.addEventListener('DOMContentLoaded', () => {
    new CharacterCreator();
}); 