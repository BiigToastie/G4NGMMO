import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import WebApp from '@twa-dev/sdk';

interface Player {
    id: number;
    name: string;
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    nameLabel: THREE.Sprite;
    position: THREE.Vector3;
}

export class GameWorld {
    private static instance: GameWorld | null = null;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly loader: GLTFLoader;
    private readonly clock: THREE.Clock;
    private readonly players: Map<number, Player>;
    private localPlayer: Player | null = null;
    private movementController: HTMLElement | null = null;
    private isMoving: boolean = false;
    private moveDirection: THREE.Vector2 = new THREE.Vector2();

    private constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.loader = new GLTFLoader();
        this.clock = new THREE.Clock();
        this.players = new Map();
        this.setupScene();
    }

    public static getInstance(): GameWorld {
        if (!GameWorld.instance) {
            GameWorld.instance = new GameWorld();
        }
        return GameWorld.instance;
    }

    private setupScene(): void {
        // Grundlegende Szeneneinrichtung
        this.scene.background = new THREE.Color(0x87ceeb); // Hellblauer Himmel
        
        // Boden
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a9d23 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Beleuchtung
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(ambientLight, directionalLight);

        // Kamera-Position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    public async initialize(): Promise<void> {
        try {
            const container = document.getElementById('game-world');
            if (!container) {
                throw new Error('Game world container nicht gefunden');
            }

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            container.appendChild(this.renderer.domElement);

            this.setupMovementController();
            window.addEventListener('resize', this.onWindowResize.bind(this));

            this.animate();
            console.log('GameWorld erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der GameWorld-Initialisierung:', error);
            throw error;
        }
    }

    private setupMovementController(): void {
        this.movementController = document.getElementById('movement-controller');
        if (!this.movementController) return;

        let startPos = new THREE.Vector2();
        const maxRadius = 50; // Maximaler Radius für den Controller

        const onTouchStart = (event: TouchEvent) => {
            const touch = event.touches[0];
            startPos.set(touch.clientX, touch.clientY);
            this.isMoving = true;
        };

        const onTouchMove = (event: TouchEvent) => {
            if (!this.isMoving) return;
            
            const touch = event.touches[0];
            const currentPos = new THREE.Vector2(touch.clientX, touch.clientY);
            this.moveDirection.subVectors(currentPos, startPos);
            
            if (this.moveDirection.length() > maxRadius) {
                this.moveDirection.normalize().multiplyScalar(maxRadius);
            }
        };

        const onTouchEnd = () => {
            this.isMoving = false;
            this.moveDirection.set(0, 0);
        };

        this.movementController.addEventListener('touchstart', onTouchStart);
        this.movementController.addEventListener('touchmove', onTouchMove);
        this.movementController.addEventListener('touchend', onTouchEnd);
    }

    public async addPlayer(id: number, name: string, gender: 'male' | 'female'): Promise<void> {
        try {
            const gltf = await this.loader.loadAsync(`/dist/models/${gender}_all/Animation_Mirror_Viewing_withSkin.glb`);
            const model = gltf.scene;
            
            model.traverse((object: THREE.Object3D) => {
                if (object instanceof THREE.SkinnedMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });

            const mixer = new THREE.AnimationMixer(model);
            if (gltf.animations.length > 0) {
                const idleAnimation = mixer.clipAction(gltf.animations[0]);
                idleAnimation.play();
            }

            // Erstelle Namensschild
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas context nicht verfügbar');

            canvas.width = 256;
            canvas.height = 64;
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '32px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(name, canvas.width / 2, canvas.height / 2 + 8);

            const nameTexture = new THREE.CanvasTexture(canvas);
            const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
            const nameLabel = new THREE.Sprite(nameMaterial);
            nameLabel.position.y = 2.5;
            nameLabel.scale.set(2, 0.5, 1);

            model.add(nameLabel);
            this.scene.add(model);

            const player: Player = {
                id,
                name,
                model,
                mixer,
                nameLabel,
                position: new THREE.Vector3()
            };

            this.players.set(id, player);

            if (WebApp.initDataUnsafe.user?.id === id) {
                this.localPlayer = player;
            }

        } catch (error) {
            console.error('Fehler beim Hinzufügen des Spielers:', error);
            throw error;
        }
    }

    public removePlayer(id: number): void {
        const player = this.players.get(id);
        if (!player) return;

        player.mixer.stopAllAction();
        this.scene.remove(player.model);
        this.players.delete(id);
    }

    private updatePlayerPositions(): void {
        if (!this.localPlayer || !this.isMoving) return;

        const moveSpeed = 0.1;
        const movement = new THREE.Vector3(
            -this.moveDirection.x * moveSpeed,
            0,
            -this.moveDirection.y * moveSpeed
        );

        this.localPlayer.model.position.add(movement);
        this.localPlayer.position.copy(this.localPlayer.model.position);

        // Kamera folgt dem Spieler
        this.camera.position.set(
            this.localPlayer.position.x,
            this.localPlayer.position.y + 5,
            this.localPlayer.position.z + 10
        );
        this.camera.lookAt(this.localPlayer.position);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();

        // Update alle Spieler-Animationen
        for (const player of this.players.values()) {
            player.mixer.update(delta);
        }

        this.updatePlayerPositions();
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        // Aufräumen
        for (const player of this.players.values()) {
            this.removePlayer(player.id);
        }
        
        this.players.clear();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
    }
} 