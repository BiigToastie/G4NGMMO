import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private gender: 'male' | 'female' = 'male';

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        
        // Cartoon-artige Materialien
        this.materials.set('body', new THREE.MeshToonMaterial({
            color: 0xffdbac,
            emissive: 0x000000,
            gradientMap: this.createToonGradient()
        }));

        this.materials.set('eyes', new THREE.MeshToonMaterial({
            color: 0x000000,
            emissive: 0x000000
        }));

        this.materials.set('mouth', new THREE.MeshToonMaterial({
            color: 0xe66767
        }));

        this.materials.set('hair', new THREE.MeshToonMaterial({
            color: 0x3d2314,
            emissive: 0x000000,
            gradientMap: this.createToonGradient()
        }));

        this.materials.set('clothing', new THREE.MeshToonMaterial({
            color: 0x2c3e50,
            emissive: 0x000000,
            gradientMap: this.createToonGradient()
        }));

        this.createCartoonCharacter();
    }

    private createToonGradient(): THREE.Texture {
        const gradientMap = new THREE.DataTexture(
            new Uint8Array([0, 128, 255]), // Drei Stufen für Cel-Shading
            3,
            1,
            THREE.LuminanceFormat
        );
        gradientMap.needsUpdate = true;
        return gradientMap;
    }

    private createCartoonCharacter() {
        this.createHead();
        this.createBody();
        this.createArms();
        this.createLegs();
    }

    private createHead() {
        // Kopf - leicht oval
        const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        headGeometry.scale(0.8, 1, 0.8);
        const head = new THREE.Mesh(headGeometry, this.materials.get('body'));
        head.position.y = 1.6;
        this.mesh.add(head);

        // Augen - einfache schwarze Ovale
        ['left', 'right'].forEach(side => {
            const eyeGeometry = new THREE.SphereGeometry(0.08, 32, 32);
            eyeGeometry.scale(1, 1.2, 0.1);
            const eye = new THREE.Mesh(eyeGeometry, this.materials.get('eyes'));
            eye.position.set(side === 'left' ? -0.15 : 0.15, 1.65, 0.35);
            this.mesh.add(eye);

            // Weiße Glanzpunkte in den Augen
            const highlightGeometry = new THREE.SphereGeometry(0.02, 16, 16);
            const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
            highlight.position.set(
                side === 'left' ? -0.13 : 0.17,
                1.67,
                0.4
            );
            this.mesh.add(highlight);
        });

        // Mund - einfache Linie
        const mouthGeometry = new THREE.BoxGeometry(0.2, 0.03, 0.01);
        const mouth = new THREE.Mesh(mouthGeometry, this.materials.get('mouth'));
        mouth.position.set(0, 1.45, 0.35);
        this.mesh.add(mouth);
    }

    private createBody() {
        // Torso - vereinfachte Trapezform
        const torsoGeometry = new THREE.CylinderGeometry(
            0.3,  // Oben
            0.4,  // Unten
            0.8,  // Höhe
            8     // Segmente
        );
        const torso = new THREE.Mesh(torsoGeometry, this.materials.get('body'));
        torso.position.y = 1.0;
        this.mesh.add(torso);
    }

    private createArms() {
        ['left', 'right'].forEach(side => {
            // Oberarm
            const upperArmGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8);
            const upperArm = new THREE.Mesh(upperArmGeometry, this.materials.get('body'));
            upperArm.position.set(side === 'left' ? -0.5 : 0.5, 1.2, 0);
            upperArm.rotation.z = side === 'left' ? Math.PI / 6 : -Math.PI / 6;
            this.mesh.add(upperArm);

            // Unterarm
            const lowerArmGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8);
            const lowerArm = new THREE.Mesh(lowerArmGeometry, this.materials.get('body'));
            lowerArm.position.set(side === 'left' ? -0.7 : 0.7, 0.9, 0);
            lowerArm.rotation.z = side === 'left' ? Math.PI / 4 : -Math.PI / 4;
            this.mesh.add(lowerArm);

            // Hand - vereinfachte Form
            const handGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const hand = new THREE.Mesh(handGeometry, this.materials.get('body'));
            hand.position.set(side === 'left' ? -0.85 : 0.85, 0.7, 0);
            hand.scale.set(0.8, 1, 0.5);
            this.mesh.add(hand);
        });
    }

    private createLegs() {
        ['left', 'right'].forEach(side => {
            // Oberschenkel
            const upperLegGeometry = new THREE.CylinderGeometry(0.15, 0.13, 0.5, 8);
            const upperLeg = new THREE.Mesh(upperLegGeometry, this.materials.get('body'));
            upperLeg.position.set(side === 'left' ? -0.2 : 0.2, 0.6, 0);
            this.mesh.add(upperLeg);

            // Unterschenkel
            const lowerLegGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 8);
            const lowerLeg = new THREE.Mesh(lowerLegGeometry, this.materials.get('body'));
            lowerLeg.position.set(side === 'left' ? -0.2 : 0.2, 0.2, 0);
            this.mesh.add(lowerLeg);

            // Fuß - vereinfachte Form
            const footGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
            const foot = new THREE.Mesh(footGeometry, this.materials.get('body'));
            foot.position.set(side === 'left' ? -0.2 : 0.2, 0.05, 0.05);
            this.mesh.add(foot);
        });
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        const scale = {
            slim: { x: 0.9, y: 1, z: 0.9 },
            average: { x: 1, y: 1, z: 1 },
            athletic: { x: 1.1, y: 1, z: 1.1 }
        };
        
        const bodyType = scale[type];
        this.mesh.scale.set(bodyType.x, bodyType.y, bodyType.z);
    }

    public setHeight(height: number) {
        const baseHeight = 1.75;
        const scale = height / baseHeight;
        this.mesh.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        const bodyMaterial = this.materials.get('body');
        if (bodyMaterial instanceof THREE.Material) {
            (bodyMaterial as THREE.MeshToonMaterial).color = color;
        }
    }

    public setEyeColor(color: THREE.Color) {
        const eyeMaterial = this.materials.get('eyes');
        if (eyeMaterial instanceof THREE.Material) {
            (eyeMaterial as THREE.MeshToonMaterial).color = color;
        }
    }

    public setHairStyle(style: string) {
        // Entferne existierende Haare
        this.mesh.children = this.mesh.children.filter(child => !child.name?.startsWith('hair'));
        
        const hairMaterial = this.materials.get('hair');
        
        switch (style) {
            case 'kurz':
                this.createShortHair(hairMaterial);
                break;
            case 'mittel':
                this.createMediumHair(hairMaterial);
                break;
            case 'lang':
                this.createLongHair(hairMaterial);
                break;
        }
    }

    private createShortHair(material: THREE.Material | undefined) {
        if (!material) return;
        
        const hairGeometry = new THREE.SphereGeometry(0.42, 8, 8);
        hairGeometry.scale(1, 0.7, 1);
        const hair = new THREE.Mesh(hairGeometry, material);
        hair.name = 'hair_short';
        hair.position.set(0, 1.7, 0);
        this.mesh.add(hair);
    }

    private createMediumHair(material: THREE.Material | undefined) {
        if (!material) return;
        
        const hairGeometry = new THREE.SphereGeometry(0.42, 8, 8);
        hairGeometry.scale(1, 0.8, 1.1);
        const hair = new THREE.Mesh(hairGeometry, material);
        hair.name = 'hair_medium';
        hair.position.set(0, 1.7, 0);
        this.mesh.add(hair);

        // Hintere Haarpartie
        const backHairGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.2);
        const backHair = new THREE.Mesh(backHairGeometry, material);
        backHair.name = 'hair_medium_back';
        backHair.position.set(0, 1.5, -0.2);
        this.mesh.add(backHair);
    }

    private createLongHair(material: THREE.Material | undefined) {
        if (!material) return;
        
        // Basis-Haar
        const hairGeometry = new THREE.SphereGeometry(0.42, 8, 8);
        hairGeometry.scale(1, 0.8, 1.1);
        const hair = new THREE.Mesh(hairGeometry, material);
        hair.name = 'hair_long';
        hair.position.set(0, 1.7, 0);
        this.mesh.add(hair);

        // Langes Rücken-Haar
        const backHairGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.2);
        const backHair = new THREE.Mesh(backHairGeometry, material);
        backHair.name = 'hair_long_back';
        backHair.position.set(0, 1.2, -0.2);
        this.mesh.add(backHair);
    }

    public setHairColor(color: THREE.Color) {
        const hairMaterial = this.materials.get('hair');
        if (hairMaterial instanceof THREE.MeshToonMaterial) {
            hairMaterial.color = color;
        }
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        // Entferne alten Ausdruck
        this.mesh.children = this.mesh.children.filter(child => !child.name?.startsWith('expression'));
        
        const mouthMaterial = this.materials.get('mouth');
        if (!mouthMaterial) return;

        switch (expression) {
            case 'happy':
                const smile = new THREE.BoxGeometry(0.2, 0.03, 0.01);
                const smileMesh = new THREE.Mesh(smile, mouthMaterial);
                smileMesh.name = 'expression_happy';
                smileMesh.position.set(0, 1.45, 0.35);
                smileMesh.rotation.z = 0.2;
                this.mesh.add(smileMesh);
                break;
            
            case 'sad':
                const frown = new THREE.BoxGeometry(0.2, 0.03, 0.01);
                const frownMesh = new THREE.Mesh(frown, mouthMaterial);
                frownMesh.name = 'expression_sad';
                frownMesh.position.set(0, 1.45, 0.35);
                frownMesh.rotation.z = -0.2;
                this.mesh.add(frownMesh);
                break;
            
            default:
                const neutral = new THREE.BoxGeometry(0.2, 0.03, 0.01);
                const neutralMesh = new THREE.Mesh(neutral, mouthMaterial);
                neutralMesh.name = 'expression_neutral';
                neutralMesh.position.set(0, 1.45, 0.35);
                this.mesh.add(neutralMesh);
        }
    }

    public setClothing(type: string, color: THREE.Color) {
        // Entferne existierende Kleidung des gleichen Typs
        this.mesh.children = this.mesh.children.filter(child => !child.name?.startsWith(`clothing_${type}`));
        
        const clothingMaterial = this.materials.get('clothing');
        if (!clothingMaterial || !(clothingMaterial instanceof THREE.MeshToonMaterial)) return;
        
        clothingMaterial.color = color;

        switch (type) {
            case 'shirt':
                this.createShirt(clothingMaterial);
                break;
            case 'pants':
                this.createPants(clothingMaterial);
                break;
            case 'shoes':
                this.createShoes(clothingMaterial);
                break;
        }
    }

    private createShirt(material: THREE.Material) {
        // Torso
        const torsoGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.4);
        const torso = new THREE.Mesh(torsoGeometry, material);
        torso.name = 'clothing_shirt_torso';
        torso.position.set(0, 1.0, 0);
        this.mesh.add(torso);

        // Ärmel
        ['left', 'right'].forEach(side => {
            const sleeveGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.4);
            const sleeve = new THREE.Mesh(sleeveGeometry, material);
            sleeve.name = `clothing_shirt_sleeve_${side}`;
            sleeve.position.set(side === 'left' ? -0.5 : 0.5, 1.1, 0);
            this.mesh.add(sleeve);
        });
    }

    private createPants(material: THREE.Material) {
        ['left', 'right'].forEach(side => {
            const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.4);
            const leg = new THREE.Mesh(legGeometry, material);
            leg.name = `clothing_pants_leg_${side}`;
            leg.position.set(side === 'left' ? -0.2 : 0.2, 0.4, 0);
            this.mesh.add(leg);
        });
    }

    private createShoes(material: THREE.Material) {
        ['left', 'right'].forEach(side => {
            const shoeGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.5);
            const shoe = new THREE.Mesh(shoeGeometry, material);
            shoe.name = `clothing_shoes_${side}`;
            shoe.position.set(side === 'left' ? -0.2 : 0.2, 0.1, 0.1);
            this.mesh.add(shoe);
        });
    }
} 