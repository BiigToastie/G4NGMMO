import * as THREE from 'three';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private skeletonHelper: THREE.SkeletonHelper | null = null;
    private bones: Map<string, THREE.Bone> = new Map();
    private mixer: THREE.AnimationMixer;
    private morphTargets: Map<string, THREE.Mesh> = new Map();
    private gender: 'male' | 'female' = 'male';
    private textureLoader: THREE.TextureLoader;
    private skinningMaterial: THREE.MeshPhysicalMaterial;

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        this.textureLoader = new THREE.TextureLoader();
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // Basis-Material ohne erweiterte Parameter
        this.skinningMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffdbac,
            roughness: 0.3,
            metalness: 0.0,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            sheen: 0.25,
            sheenRoughness: 0.25,
            transmission: 0.2,
            thickness: 0.2,
            envMapIntensity: 1.0
        });

        this.initializeMaterials();
        this.createSkeleton();
        this.createBody();
        this.setupMorphTargets();
        this.setupPhysics();
    }

    private async initializeMaterials() {
        // Basis-Hautmaterial
        const skinMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffdbac,
            roughness: 0.3,
            metalness: 0.0,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            sheen: 0.25,
            sheenRoughness: 0.25,
            transmission: 0.2,
            thickness: 0.2,
            envMapIntensity: 1.0
        });

        // Normalen-Map für Hautdetails
        const skinNormalMap = await this.textureLoader.loadAsync('/textures/skin_normal.jpg');
        skinNormalMap.wrapS = THREE.RepeatWrapping;
        skinNormalMap.wrapT = THREE.RepeatWrapping;
        skinMaterial.normalMap = skinNormalMap;
        skinMaterial.normalScale.set(0.8, 0.8);

        // Weitere Texturen
        skinMaterial.roughnessMap = await this.textureLoader.loadAsync('/textures/skin_roughness.jpg');
        skinMaterial.metalnessMap = await this.textureLoader.loadAsync('/textures/skin_metallic.jpg');
        skinMaterial.aoMap = await this.textureLoader.loadAsync('/textures/skin_ao.jpg');
        skinMaterial.displacementMap = await this.textureLoader.loadAsync('/textures/skin_height.jpg');
        skinMaterial.displacementScale = 0.05;
        skinMaterial.displacementBias = -0.025;

        this.materials.set('skin', skinMaterial);

        // Augen-Material
        const corneaMaterial = new THREE.MeshPhysicalMaterial({
            transmission: 0.99,
            thickness: 0.02,
            roughness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0
        });

        const irisMaterial = new THREE.MeshPhysicalMaterial({
            color: this.gender === 'male' ? 0x4b6584 : 0x9b4b4b,
            roughness: 0.2,
            metalness: 0.1,
            transmission: 0.2,
            thickness: 0.05,
            clearcoat: 0.5,
            sheen: 0.5
        });

        this.materials.set('cornea', corneaMaterial);
        this.materials.set('iris', irisMaterial);

        // Haar-Material
        const hairMaterial = new THREE.MeshPhysicalMaterial({
            color: this.gender === 'male' ? 0x3c2b21 : 0x6b4423,
            roughness: 0.4,
            metalness: 0.2,
            clearcoat: 0.4,
            sheen: 1.0,
            sheenRoughness: 0.3,
            transmission: 0.1
        });

        const hairNormalMap = await this.textureLoader.loadAsync('/textures/hair_normal.jpg');
        hairMaterial.normalMap = hairNormalMap;
        hairMaterial.normalScale.set(1.0, 1.0);
        this.materials.set('hair', hairMaterial);
    }

    private createSkeleton() {
        // Hauptknochen
        const bones: THREE.Bone[] = [];
        
        // Wirbelsäule
        const spine = new THREE.Bone();
        spine.position.y = 0.5;
        bones.push(spine);
        this.bones.set('spine', spine);

        // Hals
        const neck = new THREE.Bone();
        neck.position.y = 1.4;
        spine.add(neck);
        bones.push(neck);
        this.bones.set('neck', neck);

        // Kopf
        const head = new THREE.Bone();
        head.position.y = 0.2;
        neck.add(head);
        bones.push(head);
        this.bones.set('head', head);

        // Schultern
        ['left', 'right'].forEach(side => {
            const shoulder = new THREE.Bone();
            shoulder.position.x = side === 'left' ? -0.22 : 0.22;
            shoulder.position.y = 1.3;
            spine.add(shoulder);
            bones.push(shoulder);
            this.bones.set(`${side}Shoulder`, shoulder);

            // Oberarm
            const upperArm = new THREE.Bone();
            upperArm.position.y = -0.15;
            shoulder.add(upperArm);
            bones.push(upperArm);
            this.bones.set(`${side}UpperArm`, upperArm);

            // Unterarm
            const forearm = new THREE.Bone();
            forearm.position.y = -0.25;
            upperArm.add(forearm);
            bones.push(forearm);
            this.bones.set(`${side}Forearm`, forearm);

            // Hand
            const hand = new THREE.Bone();
            hand.position.y = -0.2;
            forearm.add(hand);
            bones.push(hand);
            this.bones.set(`${side}Hand`, hand);

            // Finger
            for (let i = 0; i < 5; i++) {
                const finger = new THREE.Bone();
                finger.position.x = (i - 2) * 0.02;
                finger.position.y = -0.08;
                hand.add(finger);
                bones.push(finger);
                this.bones.set(`${side}Finger${i}`, finger);
            }
        });

        // Beine
        ['left', 'right'].forEach(side => {
            const hip = new THREE.Bone();
            hip.position.x = side === 'left' ? -0.1 : 0.1;
            hip.position.y = 0.1;
            spine.add(hip);
            bones.push(hip);
            this.bones.set(`${side}Hip`, hip);

            // Oberschenkel
            const thigh = new THREE.Bone();
            thigh.position.y = -0.3;
            hip.add(thigh);
            bones.push(thigh);
            this.bones.set(`${side}Thigh`, thigh);

            // Unterschenkel
            const shin = new THREE.Bone();
            shin.position.y = -0.3;
            thigh.add(shin);
            bones.push(shin);
            this.bones.set(`${side}Shin`, shin);

            // Fuß
            const foot = new THREE.Bone();
            foot.position.y = -0.3;
            shin.add(foot);
            bones.push(foot);
            this.bones.set(`${side}Foot`, foot);

            // Zehen
            for (let i = 0; i < 5; i++) {
                const toe = new THREE.Bone();
                toe.position.x = (i - 2) * 0.02;
                toe.position.z = 0.1;
                foot.add(toe);
                bones.push(toe);
                this.bones.set(`${side}Toe${i}`, toe);
            }
        });

        // Skelett erstellen
        const skeleton = new THREE.Skeleton(bones);
        this.skeletonHelper = new THREE.SkeletonHelper(this.mesh);
    }

    private setupMorphTargets() {
        // Gesichtsausdrücke
        const expressions = ['smile', 'frown', 'surprise', 'angry', 'blink'];
        expressions.forEach(expression => {
            const morphGeometry = new THREE.BufferGeometry();
            // Hier würden die Morph-Target-Vertices definiert
            this.morphTargets.set(expression, new THREE.Mesh(morphGeometry, this.skinningMaterial));
        });

        // Muskelverformungen
        const muscles = ['bicepFlex', 'deltoidFlex', 'absFlex'];
        muscles.forEach(muscle => {
            const morphGeometry = new THREE.BufferGeometry();
            // Hier würden die Muskel-Verformungs-Vertices definiert
            this.morphTargets.set(muscle, new THREE.Mesh(morphGeometry, this.skinningMaterial));
        });
    }

    private setupPhysics() {
        // Haar-Physik
        const hairStrands = this.mesh.children.filter(child => 
            child instanceof THREE.Mesh && child.material === this.materials.get('hair')
        );

        hairStrands.forEach(strand => {
            // Hier würde die Haar-Physik-Simulation implementiert
            // z.B. mit Verlet-Integration für realistische Haarbewegungen
        });

        // Kleidungs-Physik
        const clothMeshes = this.mesh.children.filter(child =>
            child instanceof THREE.Mesh && child.material.name === 'cloth'
        );

        clothMeshes.forEach(cloth => {
            // Hier würde die Stoff-Physik-Simulation implementiert
            // z.B. mit Position Based Dynamics für realistische Stoffbewegungen
        });
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }

    public update(deltaTime: number) {
        // Animation-Mixer aktualisieren
        this.mixer.update(deltaTime);

        // Physik-Simulationen aktualisieren
        this.updatePhysics(deltaTime);

        // Morph-Targets interpolieren
        this.updateMorphTargets(deltaTime);
    }

    private updatePhysics(deltaTime: number) {
        // Haar-Physik aktualisieren
        this.updateHairPhysics(deltaTime);

        // Kleidungs-Physik aktualisieren
        this.updateClothPhysics(deltaTime);
    }

    private updateHairPhysics(deltaTime: number) {
        const gravity = new THREE.Vector3(0, -9.81, 0);
        const wind = new THREE.Vector3(
            Math.sin(Date.now() * 0.001) * 0.5,
            0,
            Math.cos(Date.now() * 0.001) * 0.5
        );

        this.mesh.children
            .filter(child => child instanceof THREE.Mesh && child.material === this.materials.get('hair'))
            .forEach(strand => {
                // Verlet-Integration für Haarbewegungen
                const vertices = (strand as THREE.Mesh).geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    // Physik-Berechnung für jeden Vertex
                }
            });
    }

    private updateClothPhysics(deltaTime: number) {
        this.mesh.children
            .filter(child => child instanceof THREE.Mesh && child.material.name === 'cloth')
            .forEach(cloth => {
                // Position Based Dynamics für Stoffsimulation
                const vertices = (cloth as THREE.Mesh).geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    // Physik-Berechnung für jeden Vertex
                }
            });
    }

    private updateMorphTargets(deltaTime: number) {
        this.morphTargets.forEach((mesh, name) => {
            // Morph-Target-Gewichte aktualisieren
            mesh.morphTargetInfluences?.forEach((influence, index) => {
                // Interpolation der Morph-Target-Gewichte
            });
        });
    }

    private createBody() {
        // Implementierung folgt später
        console.log("Creating body...");
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        // Implementierung folgt später
        console.log(`Setting body type to ${type}...`);
    }

    public setHeight(height: number) {
        this.mesh.scale.setY(height / 175);
    }

    public setSkinColor(color: THREE.Color) {
        if (this.skinningMaterial) {
            this.skinningMaterial.color = color;
        }
    }

    public setHairStyle(style: string) {
        // Implementierung folgt später
        console.log(`Setting hair style to ${style}...`);
    }

    public setHairColor(color: THREE.Color) {
        const hairMaterial = this.materials.get('hair');
        if (hairMaterial && hairMaterial instanceof THREE.MeshPhysicalMaterial) {
            hairMaterial.color = color;
        }
    }

    public setEyeColor(color: THREE.Color) {
        const irisMaterial = this.materials.get('iris');
        if (irisMaterial && irisMaterial instanceof THREE.MeshPhysicalMaterial) {
            irisMaterial.color = color;
        }
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        // Implementierung folgt später
        console.log(`Setting facial expression to ${expression}...`);
    }

    public setClothing(type: string, color: THREE.Color) {
        // Implementierung folgt später
        console.log(`Setting clothing ${type} with color...`);
    }
} 