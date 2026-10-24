import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EQUIPMENT, EQUIP_SLOTS, loadOutfit, saveOutfit } from './equipment.js';

export class Character {
  constructor(scene) {
    this.group = new THREE.Group();
    this.speed = 0.15;
    this.rotSpeed = 0.04;
    this.facing = 0;
    this.bobTime = 0;
    this.isMoving = false;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.glbLoaded = false;
    this.equipMeshes = {};
    this.outfit = loadOutfit();
    this.loader = new GLTFLoader();
    this.equipCache = {};

    this.buildFallbackModel();
    this.group.position.y = 0;
    scene.add(this.group);

    this.loadBase();
  }

  buildFallbackModel() {
    this.fallback = new THREE.Group();

    const bodyColor = 0x4fc3f7;
    const skinColor = 0xffe0b2;
    const shoeColor = 0x795548;
    const hairColor = 0x5d4037;

    const bodyGeo = new THREE.CapsuleGeometry(1.2, 1.6, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6, metalness: 0.1 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 3.2;
    this.body.castShadow = true;
    this.fallback.add(this.body);

    const headGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5, metalness: 0.05 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 5.2;
    this.head.castShadow = true;
    this.fallback.add(this.head);

    const hairGeo = new THREE.SphereGeometry(1.05, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 5.25;
    hair.castShadow = true;
    this.fallback.add(hair);

    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.35, 5.3, 0.85);
    this.fallback.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.35, 5.3, 0.85);
    this.fallback.add(rightEye);

    const legGeo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7 });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.5, 1.2, 0);
    this.leftLeg.castShadow = true;
    this.fallback.add(this.leftLeg);
    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.5, 1.2, 0);
    this.rightLeg.castShadow = true;
    this.fallback.add(this.rightLeg);

    const shoeGeo = new THREE.BoxGeometry(0.7, 0.4, 1.1);
    const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.8 });
    this.leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.leftShoe.position.set(-0.5, 0.3, 0.15);
    this.leftShoe.castShadow = true;
    this.fallback.add(this.leftShoe);
    this.rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.rightShoe.position.set(0.5, 0.3, 0.15);
    this.rightShoe.castShadow = true;
    this.fallback.add(this.rightShoe);

    const shadowGeo = new THREE.CircleGeometry(1.5, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.fallback.add(shadow);

    this.fallback.scale.set(0.4, 0.4, 0.4);
    this.group.add(this.fallback);
  }

  async loadBase() {
    try {
      const gltf = await this.loader.loadAsync('/models/char-base.glb');
      const model = gltf.scene;
      model.scale.set(1.2, 1.2, 1.2);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });

      this.group.remove(this.fallback);
      this.baseModel = model;
      this.group.add(model);
      this.glbLoaded = true;

      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) {
          const name = clip.name.toLowerCase();
          this.actions[name] = this.mixer.clipAction(clip);
        }
        this.playAction('idle');
      }

      await this.loadAllEquipment();
      console.log(`Character loaded (${gltf.animations.length} animations, ${Object.keys(this.equipMeshes).length} equip)`);
    } catch {
      console.log('No char-base.glb found, using fallback model');
    }
  }

  async loadAllEquipment() {
    const promises = EQUIP_SLOTS.map(slot => {
      const equipId = this.outfit[slot];
      if (equipId) return this.loadEquipPart(equipId);
    });
    await Promise.all(promises);
  }

  async loadEquipPart(equipId) {
    const def = EQUIPMENT[equipId];
    if (!def) return;

    try {
      let scene;
      if (this.equipCache[equipId]) {
        scene = this.equipCache[equipId].clone();
      } else {
        const gltf = await this.loader.loadAsync(`/models/${def.file}`);
        this.equipCache[equipId] = gltf.scene;
        scene = gltf.scene.clone();
      }

      scene.traverse((child) => {
        if (child.isMesh) child.castShadow = true;
      });

      const meshGroup = new THREE.Group();
      meshGroup.name = `equip-${def.slot}`;
      while (scene.children.length > 0) {
        const child = scene.children[0];
        if (child.isSkinnedMesh || child.isMesh) {
          meshGroup.add(child);
        } else {
          scene.remove(child);
        }
      }

      // Remove existing equip in this slot
      this.removeEquipSlot(def.slot);

      if (this.baseModel) {
        this.baseModel.add(meshGroup);
      }
      this.equipMeshes[def.slot] = meshGroup;
    } catch {
      // Equipment file not found — skip silently
    }
  }

  removeEquipSlot(slot) {
    const existing = this.equipMeshes[slot];
    if (existing && existing.parent) {
      existing.parent.remove(existing);
    }
    delete this.equipMeshes[slot];
  }

  async changeEquip(equipId) {
    const def = EQUIPMENT[equipId];
    if (!def) return;
    this.outfit[def.slot] = equipId;
    saveOutfit(this.outfit);
    if (this.glbLoaded) {
      await this.loadEquipPart(equipId);
    }
  }

  removeEquip(slot) {
    this.removeEquipSlot(slot);
    delete this.outfit[slot];
    saveOutfit(this.outfit);
  }

  getOutfit() {
    return { ...this.outfit };
  }

  playAction(name) {
    const action = this.actions[name];
    if (!action || action === this.currentAction) return;
    if (this.currentAction) {
      this.currentAction.fadeOut(0.2);
    }
    action.reset().fadeIn(0.2).play();
    this.currentAction = action;
  }

  update(dt, keys) {
    let dx = 0;
    let dz = 0;

    if (keys.up) dz -= 1;
    if (keys.down) dz += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    const wasMoving = this.isMoving;
    this.isMoving = dx !== 0 || dz !== 0;

    if (this.isMoving) {
      const angle = Math.atan2(dx, dz);
      this.facing = angle;
      this.group.rotation.y = angle;

      const len = Math.sqrt(dx * dx + dz * dz);
      this.group.position.x += (dx / len) * this.speed;
      this.group.position.z += (dz / len) * this.speed;
    }

    if (this.glbLoaded) {
      if (this.isMoving && !wasMoving) this.playAction('walk');
      if (!this.isMoving && wasMoving) this.playAction('idle');
      if (this.mixer) this.mixer.update(dt);
    } else {
      if (this.isMoving) {
        this.bobTime += dt * 8;
        const bob = Math.sin(this.bobTime) * 0.08;
        this.body.position.y = 3.2 + Math.abs(bob) * 0.5;
        this.head.position.y = 5.2 + Math.abs(bob) * 0.5;
        this.leftLeg.position.z = Math.sin(this.bobTime) * 0.4;
        this.rightLeg.position.z = -Math.sin(this.bobTime) * 0.4;
        this.leftShoe.position.z = 0.15 + Math.sin(this.bobTime) * 0.4;
        this.rightShoe.position.z = 0.15 - Math.sin(this.bobTime) * 0.4;
      } else {
        this.bobTime = 0;
        this.body.position.y = 3.2;
        this.head.position.y = 5.2;
        this.leftLeg.position.z = 0;
        this.rightLeg.position.z = 0;
        this.leftShoe.position.z = 0.15;
        this.rightShoe.position.z = 0.15;
      }
    }
  }

  get worldX() { return this.group.position.x; }
  get worldZ() { return this.group.position.z; }
}
