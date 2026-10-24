import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { lonLatToWorld } from './map.js';
import { NPC_PLACEMENTS } from './npc-placements.js';

function makeTalkMarker(kind = 'talk') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff8e8';
  context.strokeStyle = '#2a241e';
  context.lineWidth = 8;
  context.beginPath();
  context.roundRect(14, 16, 100, 76, 24);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(53, 88);
  context.lineTo(44, 111);
  context.lineTo(72, 91);
  context.fill();
  context.stroke();
  context.fillStyle = '#e85d3a';
  if (kind === 'quest') {
    context.font = 'bold 64px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('!', 64, 57);
  } else {
    for (const x of [43, 64, 85]) {
      context.beginPath();
      context.arc(x, 54, 6, 0, Math.PI * 2);
      context.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.45, 1.45, 1);
  sprite.position.y = 4.2;
  sprite.renderOrder = 20;
  return sprite;
}

function makeGroundMarker() {
  const geometry = new THREE.RingGeometry(0.72, 0.88, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffb74d,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(geometry, material);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  return marker;
}

export class NpcManager {
  constructor(scene, centerLon, centerLat, zoom, { placements = NPC_PLACEMENTS } = {}) {
    this.scene = scene;
    this.centerLon = centerLon;
    this.centerLat = centerLat;
    this.zoom = zoom;
    this.placements = placements;
    this.loader = new GLTFLoader();
    this.npcs = [];
    this.disposed = false;
  }

  async load() {
    await Promise.all(this.placements.map(placement => this.loadNpc(placement)));
  }

  async loadNpc(placement) {
    const { x, z } = lonLatToWorld(
      placement.lng,
      placement.lat,
      this.centerLon,
      this.centerLat,
      this.zoom
    );
    const group = new THREE.Group();
    group.name = `npc-${placement.id}`;
    group.position.set(x, 0, z);
    group.userData.npc = placement;

    const marker = makeGroundMarker();
    const talkMarker = makeTalkMarker(placement.markerKind);
    group.add(marker, talkMarker);
    this.scene.add(group);

    const entry = { placement, group, marker, talkMarker, mixer: null, elapsed: Math.random() * 4 };
    this.npcs.push(entry);

    try {
      const gltf = await this.loader.loadAsync(placement.modelPath);
      if (this.disposed) return;
      const model = gltf.scene;
      model.scale.setScalar(0.82);
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(model);
      entry.model = model;

      if (gltf.animations.length > 0) {
        entry.mixer = new THREE.AnimationMixer(model);
        const idleClip = gltf.animations.find(clip => clip.name.toLowerCase().includes('idle')) || gltf.animations[0];
        entry.mixer.clipAction(idleClip).play();
      }
    } catch (error) {
      console.warn(`NPC model failed to load: ${placement.modelPath}`, error);
    }
  }

  update(dt) {
    for (const npc of this.npcs) {
      npc.elapsed += dt;
      npc.mixer?.update(dt);
      npc.talkMarker.position.y = 4.2 + Math.sin(npc.elapsed * 2.2) * 0.12;
      const pulse = 1 + Math.sin(npc.elapsed * 2) * 0.08;
      npc.marker.scale.set(pulse, pulse, 1);
    }
  }

  getNpcAt(worldX, worldZ, radius) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const npc of this.npcs) {
      const distance = Math.hypot(npc.group.position.x - worldX, npc.group.position.z - worldZ);
      const interactionRadius = radius ?? npc.placement.interactionRadius;
      if (distance <= interactionRadius && distance < nearestDistance) {
        nearest = npc.placement;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  getRoots() {
    return this.npcs.map(npc => npc.group);
  }

  getTreeWorldPos(treeId) {
    const npc = this.npcs.find(entry => entry.placement.treeId === treeId);
    return npc ? { x: npc.group.position.x, z: npc.group.position.z } : null;
  }

  getNpcFromObject(object) {
    let current = object;
    while (current) {
      if (current.userData?.npc) return current.userData.npc;
      current = current.parent;
    }
    return null;
  }

  cleanup() {
    this.disposed = true;
    for (const npc of this.npcs) {
      npc.mixer?.stopAllAction();
      npc.group.traverse(child => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach(material => material.dispose?.());
        else child.material?.dispose?.();
        child.material?.map?.dispose?.();
      });
      this.scene.remove(npc.group);
    }
    this.npcs = [];
  }
}
