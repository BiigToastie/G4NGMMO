import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GameHUD } from './GameHUD';
import { ResourceManager } from '../ResourceManager';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private players: Map<string, THREE.Object3D>;
    private terrain: THREE.Mesh;
    private loader: GLTFLoader;
    private mixer: THREE.AnimationMixer | null = null;
    private clock: THREE.Clock;
    private hud: GameHUD;
    private playerData: any;
    private animationFrameId: number | null = null;

    constructor(container: HTMLElement, playerData: any) {
        this.playerData = playerData;
        this.clock = new THREE.Clock();
        
        // Initialisiere Three.js-Komponenten
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.players = new Map();
        this.loader = new GLTFLoader();
        this.hud = new GameHUD();

        // Renderer-Setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Kamera-Setup
        this.camera.position.set(0, 5, 10);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Beleuchtung
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 0);
        directionalLight.castShadow = true;
        this.scene.add(ambientLight, directionalLight);

        // Erstelle Terrain
        this.terrain = this.createTerrain();
        this.scene.add(this.terrain);

        // Event Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Initialisiere Spieler
        this.initializePlayer();

        // Starte Render-Loop
        this.animate();
    }

    private async initializePlayer(): Promise<void> {
        const resourceManager = ResourceManager.getInstance();
        const modelKey = this.playerData.gender === 'male' ? 'maleCharacter' : 'femaleCharacter';
        const gltf = resourceManager.getResource(modelKey);

        if (!gltf) {
            console.error('Spielermodell nicht gefunden');
            return;
        }

        const player = gltf.scene.clone();
        player.position.set(0, 0, 0);
        player.castShadow = true;
        player.receiveShadow = true;
        this.scene.add(player);
        this.players.set(this.playerData.userId, player);

        // Setze Animation
        this.mixer = new THREE.AnimationMixer(player);
        const idleAnimation = gltf.animations.find(anim => anim.name.toLowerCase().includes('idle'));
        if (idleAnimation) {
            const action = this.mixer.clipAction(idleAnimation);
            action.play();
        }

        // Aktualisiere HUD
        this.hud.updatePlayerInfo(
            this.playerData.name,
            this.playerData.class
        );

        // Zentriere Kamera auf Spieler
        this.centerCameraOnPlayer(player);
    }

    private centerCameraOnPlayer(player: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(player);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const distance = Math.max(size.x, size.y, size.z) * 3;
        this.camera.position.set(
            center.x + distance,
            center.y + distance / 2,
            center.z + distance
        );

        this.controls.target.copy(center);
        this.controls.update();
    }

    private createTerrain(): THREE.Mesh {
        // Erstelle eine einfache Wiese mit Begrenzung
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a9e3a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;

        // Erstelle Begrenzungswände
        const wallHeight = 5;
        const wallGeometry = new THREE.BoxGeometry(100, wallHeight, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

        const walls = new THREE.Group();
        
        // Norden
        const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight/2, -50);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        
        // Süden
        const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight/2, 50);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        
        // Osten
        const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
        eastWall.rotation.y = Math.PI / 2;
        eastWall.position.set(50, wallHeight/2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        
        // Westen
        const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
        westWall.rotation.y = Math.PI / 2;
        westWall.position.set(-50, wallHeight/2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;

        walls.add(northWall, southWall, eastWall, westWall);

        const terrain = new THREE.Group();
        terrain.add(ground, walls);
        return terrain as unknown as THREE.Mesh;
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.hud.dispose();
        
        // Cleanup Three.js
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
        
        // Entferne Event Listener
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
} 