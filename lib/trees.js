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
  '青楓': 0xd32f2f,
  '盾柱木': 0x7cb342,
  '豔紫荊': 0xce93d8,
  '錫蘭橄欖': 0x558b2f,
  '黃椰子': 0x33691e,
};

const DEFAULT_COLOR = 0x4caf50;
const VIEW_RADIUS = 120;

// Canopy shape types
const CANOPY = {
  ROUND:    'round',     // default sphere — 樟樹, 茄苳, 菩提樹
  SPREAD:   'spread',    // wide flat ellipsoid — 榕樹
  CONE:     'cone',      // triangular — 楓香, 青楓
  COLUMN:   'column',    // narrow tall — 白千層, 黑板樹
  PALM:     'palm',      // thin trunk + small top cluster — 大王椰子, 黃椰子
  SPARSE:   'sparse',    // tall trunk + small crown — 木棉
  UMBRELLA: 'umbrella',  // flat-top umbrella — 小葉欖仁
  VASE:     'vase',      // vase-shaped — 紫薇, 大花紫薇
  WEEPING:  'weeping',   // drooping form — 阿勃勒
};

const SPECIES_CANOPY = {
  '榕樹': CANOPY.SPREAD,
  '茄苳': CANOPY.ROUND,
  '樟樹': CANOPY.ROUND,
  '楓香': CANOPY.CONE,
  '青楓': CANOPY.CONE,
  '臺灣欒樹': CANOPY.ROUND,
  '白千層': CANOPY.COLUMN,
  '黑板樹': CANOPY.COLUMN,
  '小葉欖仁': CANOPY.UMBRELLA,
  '大花紫薇': CANOPY.VASE,
  '水黃皮': CANOPY.ROUND,
  '光蠟樹': CANOPY.ROUND,
  '苦楝': CANOPY.ROUND,
  '大王椰子': CANOPY.PALM,
  '黃椰子': CANOPY.PALM,
  '木棉': CANOPY.SPARSE,
  '菩提樹': CANOPY.SPREAD,
  '山櫻花': CANOPY.VASE,
  '紫薇': CANOPY.VASE,
  '阿勃勒': CANOPY.WEEPING,
  '盾柱木': CANOPY.ROUND,
  '豔紫荊': CANOPY.VASE,
  '錫蘭橄欖': CANOPY.ROUND,
};

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

    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    this.palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.85 });
    this.leavesMats = {};

    this.canopyGeos = {};
    this.trunkGeos = {};
    this.buildGeometries();

    this.labelSprites = new Map();
    this.questTreeIds = new Set();
    this.questSprites = new Map();
    this.questSpriteMat = null;
  }

  buildGeometries() {
    // Trunk geometries per type
    this.trunkGeos.default = new THREE.CylinderGeometry(0.15, 0.25, 2, 6);
    this.trunkGeos.palm = new THREE.CylinderGeometry(0.08, 0.12, 2, 6);
    this.trunkGeos.thick = new THREE.CylinderGeometry(0.25, 0.4, 2, 8);
    this.trunkGeos.tall = new THREE.CylinderGeometry(0.12, 0.2, 2, 6);

    // Canopy geometries — 3 sizes each (small, medium, large)
    const sizes = [1.2, 1.6, 2.2];

    this.canopyGeos[CANOPY.ROUND] = sizes.map(s =>
      new THREE.SphereGeometry(s, 8, 6)
    );

    this.canopyGeos[CANOPY.SPREAD] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 1.4, 8, 6);
      geo.scale(1.0, 0.55, 1.0);
      return geo;
    });

    this.canopyGeos[CANOPY.CONE] = sizes.map(s =>
      new THREE.ConeGeometry(s * 0.8, s * 2, 6)
    );

    this.canopyGeos[CANOPY.COLUMN] = sizes.map(s => {
      const geo = new THREE.CylinderGeometry(s * 0.5, s * 0.6, s * 2.2, 6);
      return geo;
    });

    this.canopyGeos[CANOPY.PALM] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 0.7, 6, 4);
      geo.scale(1.0, 0.5, 1.0);
      return geo;
    });

    this.canopyGeos[CANOPY.SPARSE] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 0.75, 6, 6);
      return geo;
    });

    this.canopyGeos[CANOPY.UMBRELLA] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 1.2, 8, 4);
      geo.scale(1.0, 0.35, 1.0);
      return geo;
    });

    this.canopyGeos[CANOPY.VASE] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 0.9, 6, 6);
      geo.scale(0.8, 1.1, 0.8);
      return geo;
    });

    this.canopyGeos[CANOPY.WEEPING] = sizes.map(s => {
      const geo = new THREE.SphereGeometry(s * 1.1, 8, 6);
      geo.scale(1.0, 0.7, 1.0);
      return geo;
    });
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

  createTree(species, diameter) {
    const canopyType = SPECIES_CANOPY[species] || CANOPY.ROUND;
    const sizeCategory = diameter > 40 ? 2 : diameter > 15 ? 1 : 0;

    const group = new THREE.Group();

    // Trunk
    let trunkGeo, trunkMat, trunkH, trunkScale;

    if (canopyType === CANOPY.PALM) {
      trunkGeo = this.trunkGeos.palm;
      trunkMat = this.palmTrunkMat;
      trunkH = 3 + sizeCategory * 1.5;
      trunkScale = 0.5 + sizeCategory * 0.2;
    } else if (canopyType === CANOPY.SPREAD) {
      trunkGeo = this.trunkGeos.thick;
      trunkMat = this.trunkMat;
      trunkH = 1.5 + sizeCategory * 0.6;
      trunkScale = 0.5 + sizeCategory * 0.2;
    } else if (canopyType === CANOPY.SPARSE || canopyType === CANOPY.COLUMN) {
      trunkGeo = this.trunkGeos.tall;
      trunkMat = this.trunkMat;
      trunkH = 2 + sizeCategory * 1;
      trunkScale = 0.45 + sizeCategory * 0.2;
    } else {
      trunkGeo = this.trunkGeos.default;
      trunkMat = this.trunkMat;
      trunkH = 1 + sizeCategory * 0.8;
      trunkScale = 0.45 + sizeCategory * 0.2;
    }

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.scale.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Canopy
    const canopyGeoSet = this.canopyGeos[canopyType] || this.canopyGeos[CANOPY.ROUND];
    const canopyGeo = canopyGeoSet[sizeCategory];
    const leavesMat = this.getLeavesMat(species);
    const leaves = new THREE.Mesh(canopyGeo, leavesMat);

    let canopyY;
    if (canopyType === CANOPY.PALM) {
      canopyY = trunkH + 0.3;
    } else if (canopyType === CANOPY.CONE) {
      canopyY = trunkH + canopyGeo.parameters.height * 0.4;
    } else if (canopyType === CANOPY.COLUMN) {
      canopyY = trunkH + canopyGeo.parameters.height * 0.3;
    } else if (canopyType === CANOPY.UMBRELLA || canopyType === CANOPY.SPREAD) {
      canopyY = trunkH + 0.5;
    } else {
      const radius = canopyGeo.parameters.radius || 1;
      canopyY = trunkH + radius * 0.7;
    }

    leaves.position.y = canopyY;
    leaves.castShadow = true;
    group.add(leaves);

    // Banyan: add secondary canopy lobe for large trees
    if (canopyType === CANOPY.SPREAD && sizeCategory >= 1) {
      const lobe = new THREE.Mesh(canopyGeoSet[sizeCategory - 1], leavesMat);
      lobe.position.set(0.6, canopyY - 0.3, 0.4);
      lobe.castShadow = true;
      group.add(lobe);
    }

    group.scale.set(trunkScale, trunkScale, trunkScale);
    return group;
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
        const distName = t[6] || '';
        const region = t[7] || '';
        const regionRemark = t[8] || '';
        const surveyDate = t[9] || '';

        const group = this.createTree(species, diameter);
        group.position.set(x, 0, z);
        group.userData = { treeId, species, diameter, height, dist: distName, region, regionRemark, surveyDate, index: i };

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
      ctx.fillStyle = '#FFD600';
      ctx.fill();
      ctx.strokeStyle = '#A68500';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#5D4000';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 32, 32);
      const texture = new THREE.CanvasTexture(canvas);
      this.questSpriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
    }
    const sprite = new THREE.Sprite(this.questSpriteMat.clone());
    sprite.scale.set(1.2, 1.2, 1);
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
        sprite.position.y = 4;
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
