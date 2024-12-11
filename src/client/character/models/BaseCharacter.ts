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
        
        // Verbessertes Basis-Material mit realistischen Eigenschaften
        this.skinningMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffdbac,
            roughness: 0.5,
            metalness: 0.05,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
            sheen: 0.5,
            sheenRoughness: 0.3,
            transmission: 0.2,
            thickness: 0.2,
            envMapIntensity: 1.0
        });

        this.createBasicBody();
        
        this.initializeMaterials().then(() => {
            this.createSkeleton();
            this.setupMorphTargets();
            this.setupPhysics();
        }).catch(error => {
            console.error('Fehler beim Initialisieren der Materialien:', error);
        });
    }

    private createBasicBody() {
        // Kopf mit realistischen Proportionen
        const headGeometry = this.createDetailedHead();
        const head = new THREE.Mesh(headGeometry, this.skinningMaterial);
        head.position.y = 1.6;
        this.bodyParts.set('head', head);
        this.mesh.add(head);

        // Realistischer Hals
        const neckGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16);
        const neck = new THREE.Mesh(neckGeometry, this.skinningMaterial);
        neck.position.y = 1.5;
        this.bodyParts.set('neck', neck);
        this.mesh.add(neck);

        // Anatomisch korrekter Torso
        const torsoGeometry = this.createDetailedTorso();
        const torso = new THREE.Mesh(torsoGeometry, this.skinningMaterial);
        torso.position.y = 1.1;
        this.bodyParts.set('torso', torso);
        this.mesh.add(torso);

        // Schultern
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.2 : 0.2;
            const shoulderGeometry = new THREE.SphereGeometry(0.1, 32, 32);
            const shoulder = new THREE.Mesh(shoulderGeometry, this.skinningMaterial);
            shoulder.position.set(xOffset, 1.45, 0);
            this.bodyParts.set(`${side}Shoulder`, shoulder);
            this.mesh.add(shoulder);
        });

        // Muskulöse Arme
        this.createDetailedArms();

        // Anatomisch korrekte Beine
        this.createDetailedLegs();

        // Hände und Füße
        this.createDetailedHands();
        this.createDetailedFeet();
    }

    private createDetailedHead(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        
        // Basis-Kopfform
        const baseHead = new THREE.SphereGeometry(0.12, 64, 64);
        
        // Gesichtsmerkmale
        const faceFeatures = new THREE.Group();

        // Kiefer
        const jawGeometry = new THREE.BoxGeometry(0.14, 0.08, 0.12);
        const jaw = new THREE.Mesh(jawGeometry, this.skinningMaterial);
        jaw.position.set(0, -0.06, 0);
        faceFeatures.add(jaw);

        // Wangenknochen
        ['left', 'right'].forEach(side => {
            const cheekGeometry = new THREE.SphereGeometry(0.04, 16, 16);
            const cheek = new THREE.Mesh(cheekGeometry, this.skinningMaterial);
            cheek.position.set(side === 'left' ? -0.06 : 0.06, 0, 0.06);
            faceFeatures.add(cheek);
        });

        // Nase
        const noseGeometry = this.createDetailedNose();
        const nose = new THREE.Mesh(noseGeometry, this.skinningMaterial);
        nose.position.set(0, 0, 0.1);
        faceFeatures.add(nose);

        // Augen
        this.createDetailedEyes(faceFeatures);

        // Mund
        const mouthGeometry = this.createDetailedMouth();
        const mouth = new THREE.Mesh(mouthGeometry, this.skinningMaterial);
        mouth.position.set(0, -0.04, 0.08);
        faceFeatures.add(mouth);

        // Kombiniere alle Geometrien
        const geometries = [baseHead];
        faceFeatures.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                geometries.push(child.geometry);
            }
        });

        return THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    }

    private createDetailedTorso(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        
        // Basis-Torso
        const baseTorso = new THREE.CylinderGeometry(
            this.gender === 'male' ? 0.22 : 0.2,  // Oberer Radius
            this.gender === 'male' ? 0.18 : 0.16,  // Unterer Radius
            0.6,  // Höhe
            32,   // Radialsegmente
            8,    // Höhensegmente
            true  // Offen
        );

        // Brustkorb
        const chestGeometry = new THREE.SphereGeometry(
            this.gender === 'male' ? 0.24 : 0.22,
            32,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );

        // Bauchmuskulatur
        const absGeometry = this.createAbdominalMuscles();

        // Rückenmuskulatur
        const backGeometry = this.createBackMuscles();

        // Kombiniere alle Geometrien
        return THREE.BufferGeometryUtils.mergeBufferGeometries([
            baseTorso,
            chestGeometry,
            absGeometry,
            backGeometry
        ]);
    }

    private createDetailedArms() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.25 : 0.25;
            
            // Bizeps
            const bicepGeometry = this.createMuscleCurve(0.06, 0.05, 0.25);
            const bicep = new THREE.Mesh(bicepGeometry, this.skinningMaterial);
            bicep.position.set(xOffset, 1.35, 0);
            bicep.rotation.z = side === 'left' ? 0.1 : -0.1;
            this.bodyParts.set(`${side}Bicep`, bicep);
            this.mesh.add(bicep);

            // Trizeps
            const tricepGeometry = this.createMuscleCurve(0.05, 0.04, 0.25);
            const tricep = new THREE.Mesh(tricepGeometry, this.skinningMaterial);
            tricep.position.set(xOffset, 1.35, -0.02);
            tricep.rotation.z = side === 'left' ? 0.1 : -0.1;
            this.bodyParts.set(`${side}Tricep`, tricep);
            this.mesh.add(tricep);

            // Unterarm mit Muskeldefinition
            const forearmGeometry = this.createDetailedForearm();
            const forearm = new THREE.Mesh(forearmGeometry, this.skinningMaterial);
            forearm.position.set(xOffset, 1.1, 0);
            forearm.rotation.z = side === 'left' ? 0.15 : -0.15;
            this.bodyParts.set(`${side}Forearm`, forearm);
            this.mesh.add(forearm);
        });
    }

    private createDetailedLegs() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.1 : 0.1;

            // Oberschenkelmuskulatur
            const thighGeometry = this.createDetailedThigh();
            const thigh = new THREE.Mesh(thighGeometry, this.skinningMaterial);
            thigh.position.set(xOffset, 0.8, 0);
            this.bodyParts.set(`${side}Thigh`, thigh);
            this.mesh.add(thigh);

            // Knie
            const kneeGeometry = new THREE.SphereGeometry(0.06, 32, 32);
            const knee = new THREE.Mesh(kneeGeometry, this.skinningMaterial);
            knee.position.set(xOffset, 0.6, 0);
            this.bodyParts.set(`${side}Knee`, knee);
            this.mesh.add(knee);

            // Unterschenkelmuskulatur
            const calfGeometry = this.createDetailedCalf();
            const calf = new THREE.Mesh(calfGeometry, this.skinningMaterial);
            calf.position.set(xOffset, 0.4, 0);
            this.bodyParts.set(`${side}Calf`, calf);
            this.mesh.add(calf);
        });
    }

    private createMuscleCurve(startRadius: number, endRadius: number, length: number): THREE.BufferGeometry {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, length * 0.25, 0.02),
            new THREE.Vector3(0, length * 0.75, 0.02),
            new THREE.Vector3(0, length, 0)
        ]);

        return new THREE.TubeGeometry(curve, 32, (t) => {
            const progress = t / length;
            return startRadius * (1 - progress) + endRadius * progress;
        }, 16, false);
    }

    private createDetailedNose(): THREE.BufferGeometry {
        const points = [];
        const segments = 10;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Math.sin(t * Math.PI) * 0.02;
            const y = t * 0.06;
            points.push(new THREE.Vector2(x, y));
        }
        
        return new THREE.LatheGeometry(points, 32);
    }

    private createDetailedMouth(): THREE.BufferGeometry {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.03, 0, 0),
            new THREE.Vector3(-0.01, 0, 0.01),
            new THREE.Vector3(0.01, 0, 0.01),
            new THREE.Vector3(0.03, 0, 0)
        ]);

        return new THREE.TubeGeometry(curve, 32, 0.01, 8, false);
    }

    private createDetailedEyes(parent: THREE.Group) {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.04 : 0.04;
            
            // Augapfel
            const eyeballGeometry = new THREE.SphereGeometry(0.02, 32, 32);
            const eyeball = new THREE.Mesh(eyeballGeometry, this.materials.get('cornea'));
            eyeball.position.set(xOffset, 0.02, 0.08);
            parent.add(eyeball);

            // Iris
            const irisGeometry = new THREE.CircleGeometry(0.01, 32);
            const iris = new THREE.Mesh(irisGeometry, this.materials.get('iris'));
            iris.position.set(xOffset, 0.02, 0.1);
            parent.add(iris);

            // Pupille
            const pupilGeometry = new THREE.CircleGeometry(0.005, 32);
            const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
            pupil.position.set(xOffset, 0.02, 0.101);
            parent.add(pupil);
        });
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

    private createDetailedHands() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.25 : 0.25;
            
            // Handgelenk
            const wristGeometry = new THREE.SphereGeometry(0.03, 16, 16);
            const wrist = new THREE.Mesh(wristGeometry, this.skinningMaterial);
            wrist.position.set(xOffset, 0.95, 0);
            this.bodyParts.set(`${side}Wrist`, wrist);
            this.mesh.add(wrist);

            // Handfläche
            const palmGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.02);
            const palm = new THREE.Mesh(palmGeometry, this.skinningMaterial);
            palm.position.set(xOffset, 0.85, 0);
            this.bodyParts.set(`${side}Palm`, palm);
            this.mesh.add(palm);

            // Finger mit Gelenken
            for (let i = 0; i < 5; i++) {
                const fingerOffset = (i - 2) * 0.015;
                
                // Grundgelenk
                const knuckleGeometry = new THREE.SphereGeometry(0.01, 8, 8);
                const knuckle = new THREE.Mesh(knuckleGeometry, this.skinningMaterial);
                knuckle.position.set(xOffset + fingerOffset, 0.8, 0);
                this.bodyParts.set(`${side}Knuckle${i}`, knuckle);
                this.mesh.add(knuckle);

                // Fingerglieder
                const segments = i === 0 ? 2 : 3; // Daumen hat 2, andere Finger 3 Glieder
                for (let j = 0; j < segments; j++) {
                    const phalanxGeometry = new THREE.CylinderGeometry(0.008, 0.007, 0.03, 8);
                    const phalanx = new THREE.Mesh(phalanxGeometry, this.skinningMaterial);
                    phalanx.position.set(
                        xOffset + fingerOffset,
                        0.78 - j * 0.03,
                        0
                    );
                    this.bodyParts.set(`${side}Finger${i}Phalanx${j}`, phalanx);
                    this.mesh.add(phalanx);

                    // Fingergelenke
                    if (j < segments - 1) {
                        const jointGeometry = new THREE.SphereGeometry(0.008, 8, 8);
                        const joint = new THREE.Mesh(jointGeometry, this.skinningMaterial);
                        joint.position.set(
                            xOffset + fingerOffset,
                            0.765 - j * 0.03,
                            0
                        );
                        this.bodyParts.set(`${side}Finger${i}Joint${j}`, joint);
                        this.mesh.add(joint);
                    }
                }
            }
        });
    }

    private createDetailedFeet() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.1 : 0.1;
            
            // Knöchel
            const ankleGeometry = new THREE.SphereGeometry(0.035, 16, 16);
            const ankle = new THREE.Mesh(ankleGeometry, this.skinningMaterial);
            ankle.position.set(xOffset, 0.25, 0);
            this.bodyParts.set(`${side}Ankle`, ankle);
            this.mesh.add(ankle);

            // Ferse
            const heelGeometry = new THREE.SphereGeometry(0.04, 16, 16);
            const heel = new THREE.Mesh(heelGeometry, this.skinningMaterial);
            heel.position.set(xOffset, 0.2, -0.05);
            this.bodyParts.set(`${side}Heel`, heel);
            this.mesh.add(heel);

            // Fußgewölbe
            const archGeometry = this.createFootArch();
            const arch = new THREE.Mesh(archGeometry, this.skinningMaterial);
            arch.position.set(xOffset, 0.18, 0);
            this.bodyParts.set(`${side}Arch`, arch);
            this.mesh.add(arch);

            // Zehen
            for (let i = 0; i < 5; i++) {
                const toeOffset = (i - 2) * 0.02;
                
                // Zehengrundgelenk
                const toeBaseGeometry = new THREE.SphereGeometry(0.012, 8, 8);
                const toeBase = new THREE.Mesh(toeBaseGeometry, this.skinningMaterial);
                toeBase.position.set(xOffset + toeOffset, 0.15, 0.12);
                this.bodyParts.set(`${side}ToeBase${i}`, toeBase);
                this.mesh.add(toeBase);

                // Zehenglieder
                const toeGeometry = new THREE.CylinderGeometry(0.01, 0.009, 0.03, 8);
                const toe = new THREE.Mesh(toeGeometry, this.skinningMaterial);
                toe.rotation.x = Math.PI / 2;
                toe.position.set(xOffset + toeOffset, 0.15, 0.14);
                this.bodyParts.set(`${side}Toe${i}`, toe);
                this.mesh.add(toe);
            }
        });
    }

    private createAbdominalMuscles(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        const segments = 6; // 6-Pack
        const muscles = [];

        for (let i = 0; i < segments; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            const muscleGeometry = new THREE.SphereGeometry(0.04, 16, 16);
            const matrix = new THREE.Matrix4();
            
            matrix.makeTranslation(
                col === 0 ? -0.05 : 0.05,
                -0.1 - row * 0.12,
                0.12
            );
            
            muscles.push(muscleGeometry.applyMatrix4(matrix));
        }

        return THREE.BufferGeometryUtils.mergeBufferGeometries(muscles);
    }

    private createBackMuscles(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        const muscles = [];

        // Trapezius (oberer Rücken)
        const trapGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.25, 32);
        const trapMatrix = new THREE.Matrix4().makeTranslation(0, 0.1, -0.1);
        muscles.push(trapGeometry.applyMatrix4(trapMatrix));

        // Latissimus (seitlicher Rücken)
        ['left', 'right'].forEach(side => {
            const latGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 16);
            const latMatrix = new THREE.Matrix4().makeTranslation(
                side === 'left' ? -0.15 : 0.15,
                -0.1,
                -0.1
            );
            muscles.push(latGeometry.applyMatrix4(latMatrix));
        });

        // Erector Spinae (unterer Rücken)
        ['left', 'right'].forEach(side => {
            const spineGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 16);
            const spineMatrix = new THREE.Matrix4().makeTranslation(
                side === 'left' ? -0.05 : 0.05,
                -0.2,
                -0.1
            );
            muscles.push(spineGeometry.applyMatrix4(spineMatrix));
        });

        return THREE.BufferGeometryUtils.mergeBufferGeometries(muscles);
    }

    private createDetailedForearm(): THREE.BufferGeometry {
        const muscles = [];

        // Brachioradialis (Unterarmstrecker)
        const brachioGeometry = new THREE.CylinderGeometry(0.035, 0.03, 0.25, 16);
        muscles.push(brachioGeometry);

        // Flexor Carpi (Handgelenkbeuger)
        const flexorGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.2, 16);
        const flexorMatrix = new THREE.Matrix4().makeTranslation(0.02, -0.02, 0);
        muscles.push(flexorGeometry.applyMatrix4(flexorMatrix));

        // Extensor Carpi (Handgelenkstrecker)
        const extensorGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.2, 16);
        const extensorMatrix = new THREE.Matrix4().makeTranslation(-0.02, -0.02, 0);
        muscles.push(extensorGeometry.applyMatrix4(extensorMatrix));

        return THREE.BufferGeometryUtils.mergeBufferGeometries(muscles);
    }

    private createDetailedThigh(): THREE.BufferGeometry {
        const muscles = [];

        // Quadriceps (Oberschenkelvorderseite)
        const quadGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.4, 32);
        muscles.push(quadGeometry);

        // Vastus Medialis (innerer Oberschenkelmuskel)
        const vastusGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const vastusMatrix = new THREE.Matrix4().makeTranslation(0.03, -0.15, 0.03);
        muscles.push(vastusGeometry.applyMatrix4(vastusMatrix));

        // Biceps Femoris (Oberschenkelrückseite)
        const hamstringGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 16);
        const hamstringMatrix = new THREE.Matrix4().makeTranslation(0, 0, -0.04);
        muscles.push(hamstringGeometry.applyMatrix4(hamstringMatrix));

        return THREE.BufferGeometryUtils.mergeBufferGeometries(muscles);
    }

    private createDetailedCalf(): THREE.BufferGeometry {
        const muscles = [];

        // Gastrocnemius (Wadenmuskel)
        const gastroGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.3, 32);
        muscles.push(gastroGeometry);

        // Soleus (tiefer Wadenmuskel)
        const soleusGeometry = new THREE.CylinderGeometry(0.055, 0.045, 0.25, 16);
        const soleusMatrix = new THREE.Matrix4().makeTranslation(0, -0.02, -0.01);
        muscles.push(soleusGeometry.applyMatrix4(soleusMatrix));

        return THREE.BufferGeometryUtils.mergeBufferGeometries(muscles);
    }

    private createFootArch(): THREE.BufferGeometry {
        const points = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = t * 0.15;
            const y = Math.sin(t * Math.PI) * 0.02;
            points.push(new THREE.Vector2(x, y));
        }
        
        return new THREE.LatheGeometry(points, 32);
    }
} 