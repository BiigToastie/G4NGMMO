import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private players: Map<string, THREE.Object3D>;
    private terrain: THREE.Mesh;

    constructor(container: HTMLElement) {
        // Initialisiere Three.js-Komponenten
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.players = new Map();

        // Renderer-Setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
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
        this.scene.add(ambientLight, directionalLight);

        // Erstelle Terrain
        this.terrain = this.createTerrain();
        this.scene.add(this.terrain);

        // Event Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Starte Render-Loop
        this.animate();
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

        // Erstelle Begrenzungswände
        const wallHeight = 5;
        const wallGeometry = new THREE.BoxGeometry(100, wallHeight, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

        const walls = new THREE.Group();
        
        // Norden
        const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight/2, -50);
        
        // Süden
        const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight/2, 50);
        
        // Osten
        const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
        eastWall.rotation.y = Math.PI / 2;
        eastWall.position.set(50, wallHeight/2, 0);
        
        // Westen
        const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
        westWall.rotation.y = Math.PI / 2;
        westWall.position.set(-50, wallHeight/2, 0);

        walls.add(northWall, southWall, eastWall, westWall);

        const terrain = new THREE.Group();
        terrain.add(ground, walls);
        return terrain as unknown as THREE.Mesh;
    }

    public spawnPlayer(userId: string, position: THREE.Vector3): void {
        const loader = new GLTFLoader();
        // Lade das Spielermodell
        loader.load('/models/character.glb', (gltf) => {
            const player = gltf.scene;
            player.position.copy(position);
            this.scene.add(player);
            this.players.set(userId, player);
        });
    }

    public updatePlayerPosition(userId: string, position: THREE.Vector3): void {
        const player = this.players.get(userId);
        if (player) {
            player.position.copy(position);
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
} 