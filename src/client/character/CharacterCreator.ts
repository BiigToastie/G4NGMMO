import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer, AnimationAction } from 'three';

interface CharacterData {
    name: string;
    gender: 'male' | 'female';
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
}

export class CharacterCreator {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private loadingManager: THREE.LoadingManager;
    private characterModel: THREE.Group | null = null;
    private textureLoader: THREE.TextureLoader;
    private materials: { [key: string]: THREE.Material } = {};
    private selectedGender: 'male' | 'female' = 'male';
    private selectedClass: string | null = null;
    private userName: string = '';
    private mixer: THREE.AnimationMixer | null = null;
    private currentAction: THREE.AnimationAction | null = null;
    private clock: THREE.Clock;

    constructor() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x18222d);

        // Clock für Animationen
        this.clock = new THREE.Clock();

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / (window.innerHeight * 0.3),
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
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.3);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 4;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 1.5;
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

        // Get Telegram username
        this.getUserName();

        // Initial Load
        this.loadCharacterModel();

        // Animation Loop
        this.animate();
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 2, 0);
        this.scene.add(fillLight);

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
        const modelPath = this.selectedGender === 'male' ? '/models/male_character.glb' : '/models/female_character.glb';
        
        loader.load(modelPath, (gltf) => {
            if (this.characterModel) {
                this.scene.remove(this.characterModel);
                if (this.mixer) {
                    this.mixer.stopAllAction();
                }
            }

            this.characterModel = gltf.scene;
            
            if (this.characterModel) {
                this.characterModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.characterModel.scale.set(1, 1, 1);
                this.characterModel.position.set(0, 0, 0);
                this.scene.add(this.characterModel);

                // Animation Setup
                if (gltf.animations.length > 0) {
                    console.log('Verfügbare Animationen:', gltf.animations.map(a => a.name));
                    
                    this.mixer = new THREE.AnimationMixer(this.characterModel);
                    
                    // Suche nach der Spiegelansicht-Animation
                    const idleAnimation = gltf.animations.find(anim => 
                        anim.name.toLowerCase().includes('spiegelansicht') ||
                        anim.name.toLowerCase().includes('idle') ||
                        anim.name.toLowerCase().includes('mirror') ||
                        anim.name.toLowerCase().includes('spiegel')
                    );

                    if (idleAnimation) {
                        const action = this.mixer.clipAction(idleAnimation);
                        action.play();
                        this.currentAction = action;
                        console.log('Spiegelansicht-Animation gestartet:', idleAnimation.name);
                    } else {
                        const defaultAction = this.mixer.clipAction(gltf.animations[0]);
                        defaultAction.play();
                        this.currentAction = defaultAction;
                        console.log('Standard-Animation gestartet:', gltf.animations[0].name);
                    }

                    // Automatische Rotation für weibliches Modell
                    if (this.selectedGender === 'female') {
                        this.characterModel.rotation.y = Math.PI; // Drehe um 180 Grad
                        const rotateSpeed = 0.002; // Langsamere Rotation
                        const animate = () => {
                            if (this.characterModel) {
                                this.characterModel.rotation.y += rotateSpeed;
                            }
                            requestAnimationFrame(animate);
                        };
                        animate();
                    }
                } else {
                    console.warn('Keine Animationen im Modell gefunden');
                }
            }
        }, 
        (progress) => {
            console.log('Ladefortschritt:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
        },
        (error) => {
            console.error('Fehler beim Laden des Modells:', error);
        });
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Gender Selection
        document.querySelectorAll('.selection-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const gender = target.getAttribute('data-gender') as 'male' | 'female';
                if (gender) {
                    this.selectedGender = gender;
                    document.querySelectorAll('.selection-button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    target.classList.add('selected');
                    this.loadCharacterModel();
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
}

// Initialisiere den CharacterCreator
window.addEventListener('DOMContentLoaded', () => {
    new CharacterCreator();
}); 