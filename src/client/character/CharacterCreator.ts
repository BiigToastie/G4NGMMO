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
    private materials: { [key: string]: THREE.Material } = {};

    constructor() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / (window.innerHeight * 0.6),
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 3);

        // Renderer Setup
        const canvas = document.getElementById('character-canvas') as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 4;
        this.controls.minPolarAngle = Math.PI / 4; // 45 Grad
        this.controls.maxPolarAngle = Math.PI / 1.5; // 120 Grad
        this.controls.target.set(0, 1.7, 0);
        this.controls.update();

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
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Key Light (vorne)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        // Fill Light (links)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 2, 0);
        this.scene.add(fillLight);

        // Back Light (hinten oben)
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
        
        // Lade Texturen
        const baseTexture = this.textureLoader.load('/models/textures/base_texture.png');
        const normalMap = this.textureLoader.load('/models/textures/normal_map.png');
        const roughnessMap = this.textureLoader.load('/models/textures/roughness_map.png');
        
        baseTexture.flipY = false;
        normalMap.flipY = false;
        roughnessMap.flipY = false;
        
        loader.load('/models/character.gltf', (gltf) => {
            if (this.characterModel) {
                this.scene.remove(this.characterModel);
            }

            this.characterModel = gltf.scene;
            
            if (this.characterModel) {
                // Erstelle und speichere Materialien
                this.characterModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const material = new THREE.MeshStandardMaterial({
                            map: baseTexture,
                            normalMap: normalMap,
                            roughnessMap: roughnessMap,
                            metalness: 0.0,
                            roughness: 0.8
                        });

                        // Speichere Material für spätere Anpassungen
                        this.materials[child.name] = material;
                        child.material = material;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.characterModel.scale.set(1, 1, 1);
                this.characterModel.position.set(0, 0, 0);
                this.scene.add(this.characterModel);

                // Apply initial settings
                this.updateCharacterHeight(175);
                this.updateSkinColor('#f4d03f');
                this.updateHairColor('#3d2314');
                this.updateBodyType('average');
                this.updateMuscleTone(50);
                this.updateFaceShape('oval');
            }
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
            let scaleX = 1.0;
            let scaleZ = 1.0;

            switch (bodyType) {
                case 'slim':
                    scaleX = 0.9;
                    scaleZ = 0.9;
                    break;
                case 'athletic':
                    scaleX = 1.1;
                    scaleZ = 1.0;
                    break;
                case 'average':
                default:
                    scaleX = 1.0;
                    scaleZ = 1.0;
                    break;
            }

            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('body')) {
                    child.scale.setX(scaleX);
                    child.scale.setZ(scaleZ);
                }
            });
        }
    }

    private updateMuscleTone(value: number): void {
        if (this.characterModel) {
            const normalizedValue = value / 100;
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('muscle')) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.roughness = 0.8 - (normalizedValue * 0.3); // Muskulösere Bereiche glänzen mehr
                }
            });
        }
    }

    private updateSkinColor(color: string): void {
        if (this.characterModel) {
            const newColor = new THREE.Color(color);
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('skin')) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.color = newColor;
                    material.needsUpdate = true;
                }
            });
        }
    }

    private updateHairColor(color: string): void {
        if (this.characterModel) {
            const newColor = new THREE.Color(color);
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('hair')) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.color = newColor;
                    material.needsUpdate = true;
                }
            });
        }
    }

    private updateFaceShape(shape: string): void {
        if (this.characterModel) {
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('face')) {
                    let scaleX = 1.0;
                    let scaleY = 1.0;

                    switch (shape) {
                        case 'round':
                            scaleX = 1.1;
                            scaleY = 0.95;
                            break;
                        case 'oval':
                            scaleX = 1.0;
                            scaleY = 1.1;
                            break;
                        case 'square':
                            scaleX = 1.05;
                            scaleY = 1.0;
                            break;
                    }

                    child.scale.setX(scaleX);
                    child.scale.setY(scaleY);
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

        document.getElementById('muscle-tone')?.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            this.updateMuscleTone(value);
        });

        document.getElementById('skin-color')?.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.updateSkinColor(color);
        });

        document.getElementById('hair-color')?.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.updateHairColor(color);
        });

        document.getElementById('face-shape')?.addEventListener('change', (e) => {
            const shape = (e.target as HTMLSelectElement).value;
            this.updateFaceShape(shape);
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
            muscleTone: (document.getElementById('muscle-tone') as HTMLInputElement)?.value || '50',
            skinColor: (document.getElementById('skin-color') as HTMLInputElement)?.value || '#f4d03f',
            hairStyle: (document.getElementById('hair-style') as HTMLSelectElement)?.value || 'kurz',
            hairColor: (document.getElementById('hair-color') as HTMLInputElement)?.value || '#3d2314',
            faceShape: (document.getElementById('face-shape') as HTMLSelectElement)?.value || 'oval',
            noseType: (document.getElementById('nose-type') as HTMLSelectElement)?.value || 'medium',
            lipSize: (document.getElementById('lip-size') as HTMLInputElement)?.value || '50',
            jawWidth: (document.getElementById('jaw-width') as HTMLInputElement)?.value || '50'
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