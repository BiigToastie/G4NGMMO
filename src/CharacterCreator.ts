import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class CharacterCreator {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loadingManager: THREE.LoadingManager;
    private characterModel: THREE.Group | null = null;

    constructor() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth * 0.6 / (window.innerHeight * 0.6),
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

        // Lighting Setup
        this.setupLighting();

        // Loading Manager
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();

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

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // UI Controls
        document.getElementById('character-height')?.addEventListener('input', (e) => {
            const height = (e.target as HTMLInputElement).value;
            document.getElementById('height-value')!.textContent = `${height} cm`;
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

        // Preset Colors
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = (e.target as HTMLElement).getAttribute('data-color');
                if (color) {
                    const parent = (e.target as HTMLElement).closest('.control-item');
                    const colorInput = parent?.querySelector('input[type="color"]') as HTMLInputElement;
                    if (colorInput) {
                        colorInput.value = color;
                        colorInput.dispatchEvent(new Event('input'));
                    }
                }
            });
        });
    }

    private loadCharacterModel(): void {
        const loader = new GLTFLoader(this.loadingManager);
        loader.load('/models/character.glb', (gltf) => {
            if (this.characterModel) {
                this.scene.remove(this.characterModel);
            }

            this.characterModel = gltf.scene;
            this.characterModel.scale.set(1, 1, 1);
            this.characterModel.position.set(0, 0, 0);
            this.scene.add(this.characterModel);

            // Apply initial settings
            this.updateCharacterHeight(175);
            this.updateSkinColor('#f4d03f');
            this.updateHairColor('#3d2314');
        });
    }

    private updateCharacterHeight(height: number): void {
        if (this.characterModel) {
            const scale = height / 175; // Base height is 175cm
            this.characterModel.scale.setY(scale);
        }
    }

    private updateBodyType(bodyType: string): void {
        if (this.characterModel) {
            // Implementiere verschiedene Körpertypen durch Skalierung oder Mesh-Morphing
            switch (bodyType) {
                case 'slim':
                    this.characterModel.scale.setX(0.9);
                    break;
                case 'average':
                    this.characterModel.scale.setX(1.0);
                    break;
                case 'athletic':
                    this.characterModel.scale.setX(1.1);
                    break;
            }
        }
    }

    private updateSkinColor(color: string): void {
        if (this.characterModel) {
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (child.name.toLowerCase().includes('skin')) {
                        (child.material as THREE.MeshStandardMaterial).color.setHex(
                            parseInt(color.replace('#', ''), 16)
                        );
                    }
                }
            });
        }
    }

    private updateHairColor(color: string): void {
        if (this.characterModel) {
            this.characterModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (child.name.toLowerCase().includes('hair')) {
                        (child.material as THREE.MeshStandardMaterial).color.setHex(
                            parseInt(color.replace('#', ''), 16)
                        );
                    }
                }
            });
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth * 0.6 / (window.innerHeight * 0.6);
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
            name: (document.getElementById('character-name') as HTMLInputElement).value,
            gender: (document.getElementById('character-gender') as HTMLSelectElement).value,
            height: (document.getElementById('character-height') as HTMLInputElement).value,
            bodyType: (document.getElementById('body-type') as HTMLSelectElement).value,
            skinColor: (document.getElementById('skin-color') as HTMLInputElement).value,
            hairStyle: (document.getElementById('hair-style') as HTMLSelectElement).value,
            hairColor: (document.getElementById('hair-color') as HTMLInputElement).value,
        };

        // Speichere die Charakterdaten
        localStorage.setItem('characterData', JSON.stringify(characterData));
        
        // Sende die Daten an den Server
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
                window.location.href = '/game.html'; // Weiterleitung zum Spiel
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