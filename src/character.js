import * as THREE from 'three';

export class Character {
  constructor(scene) {
    this.group = new THREE.Group();
    this.speed = 0.15;
    this.rotSpeed = 0.04;
    this.facing = 0;
    this.bobTime = 0;
    this.isMoving = false;

    this.buildModel();
    this.group.position.y = 0;
    scene.add(this.group);
  }

  buildModel() {
    const bodyColor = 0x4fc3f7;
    const skinColor = 0xffe0b2;
    const shoeColor = 0x795548;
    const hairColor = 0x5d4037;

    // Body (rounded capsule-ish)
    const bodyGeo = new THREE.CapsuleGeometry(1.2, 1.6, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 3.2;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Head
    const headGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.5,
      metalness: 0.05,
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 5.2;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(1.05, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.8,
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 5.25;
    hair.castShadow = true;
    this.group.add(hair);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.35, 5.3, 0.85);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.35, 5.3, 0.85);
    this.group.add(rightEye);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.7,
    });

    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.5, 1.2, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.5, 1.2, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.7, 0.4, 1.1);
    const shoeMat = new THREE.MeshStandardMaterial({
      color: shoeColor,
      roughness: 0.8,
    });
    this.leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.leftShoe.position.set(-0.5, 0.3, 0.15);
    this.leftShoe.castShadow = true;
    this.group.add(this.leftShoe);

    this.rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.rightShoe.position.set(0.5, 0.3, 0.15);
    this.rightShoe.castShadow = true;
    this.group.add(this.rightShoe);

    // Shadow circle on ground
    const shadowGeo = new THREE.CircleGeometry(1.5, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    this.group.scale.set(0.4, 0.4, 0.4);
  }

  update(dt, keys) {
    let dx = 0;
    let dz = 0;

    if (keys.up) dz -= 1;
    if (keys.down) dz += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    this.isMoving = dx !== 0 || dz !== 0;

    if (this.isMoving) {
      const angle = Math.atan2(dx, dz);
      this.facing = angle;
      this.group.rotation.y = angle;

      const len = Math.sqrt(dx * dx + dz * dz);
      this.group.position.x += (dx / len) * this.speed;
      this.group.position.z += (dz / len) * this.speed;
    }

    // Walk animation
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

  get worldX() { return this.group.position.x; }
  get worldZ() { return this.group.position.z; }
}
