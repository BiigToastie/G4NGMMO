import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer, AnimationAction } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { WebApp } from '@twa-dev/sdk';

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
    private welcomeOverlay: HTMLElement;
    private acceptButton: HTMLElement;
    private playerName: string;

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
        this.camera.position.set(0, 2.2, 2.5);
        this.camera.lookAt(0, 1.5, 0);

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
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 3;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.target.set(0, 1.5, 0);
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

        this.welcomeOverlay = document.getElementById('welcome-overlay')!;
        this.acceptButton = document.getElementById('accept-button')!;
        
        // Extrahiere den Spielernamen aus den Telegram-Daten
        const initData = WebApp.initData || '';
        const initDataObj = Object.fromEntries(new URLSearchParams(initData));
        this.playerName = initDataObj.user ? JSON.parse(initDataObj.user).first_name : 'Unbekannter Held';
        
        this.setupWelcomeScreen();
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
        
        // Zeitmessung Start
        const startTime = performance.now();
        
        // Lade das Modell in niedriger Qualität zuerst
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(modelPath, (gltf) => {
            // Zeitmessung Ende
            const endTime = performance.now();
            console.log(`Modell in ${((endTime - startTime)/1000).toFixed(2)} Sekunden geladen`);

            if (this.characterModel) {
                this.scene.remove(this.characterModel);
                if (this.mixer) {
                    this.mixer.stopAllAction();
                }
            }

            this.characterModel = gltf.scene;
            
            if (this.characterModel) {
                // Optimiere Materialien und Texturen
                this.characterModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Optimiere Materialien
                        if (child.material) {
                            const material = child.material as THREE.MeshStandardMaterial;
                            
                            // Reduziere Texturqualität
                            if (material.map) {
                                material.map.minFilter = THREE.LinearFilter;
                                material.map.magFilter = THREE.LinearFilter;
                                material.map.anisotropy = 1;
                            }

                            // Deaktiviere nicht benötigte Features
                            material.envMapIntensity = 0;
                            material.needsUpdate = true;
                        }

                        // Optimiere Geometrie
                        if (child.geometry) {
                            child.geometry.computeBoundingSphere();
                            child.geometry.computeBoundingBox();
                        }
                    }
                });

                // Position und Skalierung anpassen
                this.characterModel.scale.set(1, 1, 1);
                this.characterModel.position.set(0, 0.8, 0); // Modell höher positionieren

                // Berechne Bounding Box für automatische Positionierung
                const box = new THREE.Box3().setFromObject(this.characterModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Zentriere das Modell basierend auf seiner tatsächlichen Größe
                this.characterModel.position.y = -center.y + size.y / 2 + 0.8;

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
                        // Optimiere Animation-Performance
                        action.clampWhenFinished = true;
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.play();
                        this.currentAction = action;
                        console.log('Spiegelansicht-Animation gestartet:', idleAnimation.name);
                    } else {
                        const defaultAction = this.mixer.clipAction(gltf.animations[0]);
                        defaultAction.clampWhenFinished = true;
                        defaultAction.setLoop(THREE.LoopRepeat, Infinity);
                        defaultAction.play();
                        this.currentAction = defaultAction;
                        console.log('Standard-Animation gestartet:', gltf.animations[0].name);
                    }

                    // Optimierte Rotation für weibliches Modell
                    if (this.selectedGender === 'female') {
                        this.characterModel.rotation.y = Math.PI;
                        const rotateSpeed = 0.002;
                        let lastTime = 0;
                        const animate = (time: number) => {
                            if (this.characterModel) {
                                const delta = time - lastTime;
                                this.characterModel.rotation.y += rotateSpeed * (delta / 16.67); // Normalisiert auf 60 FPS
                                lastTime = time;
                                requestAnimationFrame(animate);
                            }
                        };
                        requestAnimationFrame(animate);
                    }
                } else {
                    console.warn('Keine Animationen im Modell gefunden');
                }
            }
        }, 
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            console.log(`Ladefortschritt: ${percent}% (${(progress.loaded / 1024 / 1024).toFixed(2)}MB / ${(progress.total / 1024 / 1024).toFixed(2)}MB)`);
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

    private setupWelcomeScreen(): void {
        // Zeige den Spielernamen im Willkommenstext
        const welcomeTitle = document.querySelector('.welcome-title')!;
        welcomeTitle.textContent = `Willkommen, ${this.playerName}!`;

        this.acceptButton.addEventListener('click', () => {
            // Speichere die Akzeptanz der Regeln
            localStorage.setItem('rulesAccepted', 'true');
            
            // Blende das Overlay sanft aus
            this.welcomeOverlay.style.opacity = '0';
            setTimeout(() => {
                this.welcomeOverlay.style.display = 'none';
                // Initialisiere die Charaktererstellung
                this.initializeCharacterCreation();
            }, 500);
        });

        // Prüfe, ob die Regeln bereits akzeptiert wurden
        if (localStorage.getItem('rulesAccepted')) {
            this.welcomeOverlay.style.display = 'none';
            this.initializeCharacterCreation();
        }
    }

    private initializeCharacterCreation(): void {
        // Aktualisiere den Spielernamen im UI
        const nameInput = document.getElementById('character-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = this.playerName;
        }
        
        // ... rest of initialization code ...
    }
}

// Initialisiere den CharacterCreator
window.addEventListener('DOMContentLoaded', () => {
    new CharacterCreator();
}); 