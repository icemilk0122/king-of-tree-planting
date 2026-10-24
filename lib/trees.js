import * as THREE from 'three';
import { lonLatToWorld } from './map.js';

const SPECIES_COLORS = {
  '榕樹': 0x2e7d32,
  '茄苳': 0x388e3c,
  '樟樹': 0x43a047,
  '楓香': 0xc62828,
  '臺灣欒樹': 0xef6c00,
  '白千層': 0x66bb6a,
  '黑板樹': 0x1b5e20,
  '小葉欖仁': 0x558b2f,
  '大花紫薇': 0x8e24aa,
  '水黃皮': 0x7cb342,
  '光蠟樹': 0xa5d6a7,
  '苦楝': 0x689f38,
  '大王椰子': 0x33691e,
  '木棉': 0xe53935,
  '菩提樹': 0x4caf50,
  '山櫻花': 0xf06292,
  '紫薇': 0xba68c8,
  '阿勃勒': 0xfdd835,
};

const DEFAULT_COLOR = 0x4caf50;
const VIEW_RADIUS = 120;
const HYBRID_RADIUS = 60;

export class TreeManager {
  constructor(scene, centerLon, centerLat, zoom) {
    this.scene = scene;
    this.centerLon = centerLon;
    this.centerLat = centerLat;
    this.zoom = zoom;
    this.allTrees = null;
    this.activeTrees = new Map();
    this.loading = false;
    this.loaded = false;

    this.trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 6);
    this.leavesGeos = [
      new THREE.SphereGeometry(1.0, 6, 6),
      new THREE.SphereGeometry(1.3, 6, 6),
      new THREE.SphereGeometry(1.6, 8, 6),
    ];
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    this.leavesMats = {};

    this.labelSprites = new Map();
    this.questTreeIds = new Set();
    this.questSprites = new Map();
    this.questSpriteMat = null;
  }

  getLeavesMat(species) {
    if (!this.leavesMats[species]) {
      const color = SPECIES_COLORS[species] || DEFAULT_COLOR;
      this.leavesMats[species] = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
      });
    }
    return this.leavesMats[species];
  }

  async load() {
    if (this.loading || this.loaded) return;
    this.loading = true;
    try {
      const res = await fetch('/data/trees.json');
      this.allTrees = await res.json();
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load tree data:', err);
    }
    this.loading = false;
  }

  update(playerX, playerZ) {
    if (!this.allTrees) return;

    const needed = new Set();

    for (let i = 0; i < this.allTrees.length; i++) {
      const t = this.allTrees[i];
      const lat = t[0], lon = t[1];
      const { x, z } = lonLatToWorld(lon, lat, this.centerLon, this.centerLat, this.zoom);

      const dx = x - playerX;
      const dz = z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > VIEW_RADIUS) continue;

      const key = i;
      needed.add(key);

      if (!this.activeTrees.has(key)) {
        const species = t[2];
        const diameter = t[3] || 10;
        const height = t[4] || 5;
        const treeId = t[5];
        const dist = t[6] || '';
        const region = t[7] || '';
        const regionRemark = t[8] || '';
        const surveyDate = t[9] || '';

        const group = new THREE.Group();

        const sizeCategory = diameter > 40 ? 2 : diameter > 15 ? 1 : 0;
        const trunkH = 1 + sizeCategory * 0.8;
        const scale = 0.3 + sizeCategory * 0.15;

        const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.scale.y = trunkH / 2;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(this.leavesGeos[sizeCategory], this.getLeavesMat(species));
        leaves.position.y = trunkH + this.leavesGeos[sizeCategory].parameters.radius * 0.7;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, 0, z);
        group.scale.set(scale, scale, scale);
        group.userData = { treeId, species, diameter, height, dist, region, regionRemark, surveyDate, index: i };

        this.scene.add(group);
        this.activeTrees.set(key, group);
      }
    }

    for (const [key, group] of this.activeTrees) {
      if (!needed.has(key)) {
        const treeId = group.userData.treeId;
        if (treeId && this.questSprites.has(treeId)) {
          this.scene.remove(this.questSprites.get(treeId));
          this.questSprites.delete(treeId);
        }
        this.scene.remove(group);
        this.activeTrees.delete(key);
      }
    }
    if (this.questTreeIds.size > 0) this.updateQuestSprites();
  }

  setQuestTreeIds(ids) {
    this.questTreeIds = new Set(ids);
    this.updateQuestSprites();
  }

  removeQuestTreeId(treeId) {
    this.questTreeIds.delete(treeId);
    const sprite = this.questSprites.get(treeId);
    if (sprite) {
      this.scene.remove(sprite);
      this.questSprites.delete(treeId);
    }
  }

  createQuestSprite() {
    if (!this.questSpriteMat) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#5CB8B2';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◇', 32, 34);
      const texture = new THREE.CanvasTexture(canvas);
      this.questSpriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
    }
    const sprite = new THREE.Sprite(this.questSpriteMat.clone());
    sprite.scale.set(1.5, 1.5, 1);
    return sprite;
  }

  updateQuestSprites() {
    for (const [treeId, sprite] of this.questSprites) {
      if (!this.questTreeIds.has(treeId)) {
        this.scene.remove(sprite);
        this.questSprites.delete(treeId);
      }
    }
    for (const [, group] of this.activeTrees) {
      const treeId = group.userData.treeId;
      if (treeId && this.questTreeIds.has(treeId) && !this.questSprites.has(treeId)) {
        const sprite = this.createQuestSprite();
        sprite.position.copy(group.position);
        sprite.position.y = 8;
        this.scene.add(sprite);
        this.questSprites.set(treeId, sprite);
      }
    }
  }

  getTreeAt(playerX, playerZ, radius = 3) {
    let closest = null;
    let closestDist = radius;

    for (const [, group] of this.activeTrees) {
      const dx = group.position.x - playerX;
      const dz = group.position.z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = group.userData;
      }
    }
    return closest;
  }
}
