import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BaseCharacter } from './models/BaseCharacter';

export class CharacterCreator {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private character: BaseCharacter;
    private lights: THREE.Light[];
    private currentExpression: 'neutral' | 'happy' | 'sad' = 'neutral';
    private gender: 'male' | 'female' = 'male';

    constructor(container: HTMLElement, gender: 'male' | 'female' = 'male') {
        this.gender = gender;
        
        // Szene einrichten
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Kamera einrichten
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 2);
        this.camera.lookAt(0, 1.7, 0);

        // Renderer einrichten
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Kontrollen einrichten
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.target.set(0, 1.7, 0);

        // Charakter erstellen
        this.character = new BaseCharacter(this.gender);
        this.scene.add(this.character.getMesh());

        // Beleuchtung einrichten
        this.lights = [];
        this.setupLights();

        // Event Listener für Fenster-Größenänderung
        window.addEventListener('resize', () => this.onWindowResize(container));

        // Animation starten
        this.animate();

        // Standard-Frisur setzen
        this.setHairStyle(this.gender === 'male' ? 'spiky' : 'long');
    }

    private setupLights() {
        // Hauptlicht
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.lights.push(mainLight);
        this.scene.add(mainLight);

        // Füllicht
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 3, -5);
        this.lights.push(fillLight);
        this.scene.add(fillLight);

        // Ambientes Licht
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.lights.push(ambientLight);
        this.scene.add(ambientLight);
    }

    private onWindowResize(container: HTMLElement) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public setGender(gender: 'male' | 'female') {
        this.gender = gender;
        // Alten Charakter entfernen
        this.scene.remove(this.character.getMesh());
        // Neuen Charakter erstellen
        this.character = new BaseCharacter(gender);
        this.scene.add(this.character.getMesh());
        // Standard-Frisur setzen
        this.setHairStyle(gender === 'male' ? 'spiky' : 'long');
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        this.character.setBodyType(type);
    }

    public setHeight(height: number) {
        this.character.setHeight(height);
    }

    public setSkinTone(color: THREE.Color) {
        this.character.setSkinColor(color);
    }

    public setHairStyle(style: string) {
        this.character.setHairStyle(style);
    }

    public setHairColor(color: THREE.Color) {
        this.character.setHairColor(color);
    }

    public setEyeColor(color: THREE.Color) {
        this.character.setEyeColor(color);
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        this.currentExpression = expression;
        this.character.setFacialExpression(expression);
    }

    public setClothing(type: string, color: THREE.Color) {
        this.character.setClothing(type, color);
    }

    public exportCharacter() {
        return {
            gender: this.gender,
            bodyType: 'average', // TODO: Speichere den aktuellen Körpertyp
            height: 175, // TODO: Speichere die aktuelle Höhe
            skinTone: '#ffdbac', // TODO: Speichere die aktuelle Hautfarbe
            hairStyle: this.gender === 'male' ? 'spiky' : 'long', // TODO: Speichere den aktuellen Haarstil
            hairColor: this.gender === 'female' ? '#ffb6c1' : '#4a2f23', // TODO: Speichere die aktuelle Haarfarbe
            eyeColor: '#87CEEB', // TODO: Speichere die aktuelle Augenfarbe
            expression: this.currentExpression,
            clothing: {
                [this.gender === 'male' ? 'shirt' : 'dress']: {
                    style: this.gender === 'male' ? 't-shirt' : 'uniform',
                    color: '#ffffff'
                },
                [this.gender === 'male' ? 'pants' : 'bow']: {
                    style: this.gender === 'male' ? 'pants' : 'ribbon',
                    color: this.gender === 'male' ? '#000000' : '#ff0000'
                }
            }
        };
    }
} 