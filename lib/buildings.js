import * as THREE from 'three';
import { lonLatToWorld } from './map.js';

const VIEW_RADIUS = 150;

const BUILDING_TYPES = {
  low:    { maxH: 12,  colors: [0xd4c4a8, 0xc9b896, 0xbfae8a, 0xd1c1a0], roughness: 0.9,  metalness: 0.02 },
  mid:    { maxH: 24,  colors: [0xc8bfb0, 0xbdb5a6, 0xc2baa8, 0xb8b0a0], roughness: 0.8,  metalness: 0.05 },
  high:   { maxH: 60,  colors: [0xa8b8c8, 0x9ab0c0, 0xb0bcc8, 0x8ea8b8], roughness: 0.5,  metalness: 0.2  },
  tower:  { maxH: 999, colors: [0x90a8b8, 0x88a0b0, 0x7898a8, 0x8090a0], roughness: 0.35, metalness: 0.35 },
};

function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getBuildingType(height) {
  if (height <= 12)  return BUILDING_TYPES.low;
  if (height <= 24)  return BUILDING_TYPES.mid;
  if (height <= 60)  return BUILDING_TYPES.high;
  return BUILDING_TYPES.tower;
}

export class BuildingManager {
  constructor(scene, centerLon, centerLat, zoom) {
    this.scene = scene;
    this.centerLon = centerLon;
    this.centerLat = centerLat;
    this.zoom = zoom;
    this.allBuildings = null;
    this.activeBuildings = new Map();
    this.loading = false;
    this.loaded = false;

    this.materials = {};
    for (const [key, bt] of Object.entries(BUILDING_TYPES)) {
      this.materials[key] = bt.colors.map(c =>
        new THREE.MeshStandardMaterial({ color: c, roughness: bt.roughness, metalness: bt.metalness })
      );
    }

    this.edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x908878, transparent: true, opacity: 0.25,
    });

    this.geoCache = new Map();
  }

  getGeo(w, h, d) {
    const key = `${w.toFixed(1)}_${h.toFixed(0)}_${d.toFixed(1)}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, Math.round(h), d));
    }
    return this.geoCache.get(key);
  }

  createRoof(w, d, roofH) {
    const shape = new THREE.Shape();
    const hw = w / 2, hd = d / 2;
    shape.moveTo(-hw, -hd);
    shape.lineTo(hw, -hd);
    shape.lineTo(hw, hd);
    shape.lineTo(-hw, hd);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0,
      bevelEnabled: true,
      bevelThickness: roofH,
      bevelSize: 0.3,
      bevelSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  async load() {
    if (this.loading || this.loaded) return;
    this.loading = true;
    try {
      const res = await fetch('/data/buildings.json');
      this.allBuildings = await res.json();
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load building data:', err);
    }
    this.loading = false;
  }

  update(playerX, playerZ) {
    if (!this.allBuildings) return;

    const needed = new Set();

    for (let i = 0; i < this.allBuildings.length; i++) {
      const b = this.allBuildings[i];
      const lat = b[0], lon = b[1];
      const { x, z } = lonLatToWorld(lon, lat, this.centerLon, this.centerLat, this.zoom);

      const dx = x - playerX;
      const dz = z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > VIEW_RADIUS) continue;

      needed.add(i);

      if (!this.activeBuildings.has(i)) {
        const height = b[2] || 9;
        const scaledH = height * 0.25;
        const bt = getBuildingType(height);
        const rng = seededRandom(i * 7919);

        const baseW = height <= 12 ? 2.5 + rng() * 2.5
                    : height <= 24 ? 3.5 + rng() * 3
                    : height <= 60 ? 4 + rng() * 4
                    : 5 + rng() * 5;
        const baseD = height <= 12 ? 2.5 + rng() * 2.5
                    : height <= 24 ? 3.5 + rng() * 3
                    : height <= 60 ? 4 + rng() * 4
                    : 5 + rng() * 5;

        const typeKey = height <= 12 ? 'low' : height <= 24 ? 'mid' : height <= 60 ? 'high' : 'tower';
        const mats = this.materials[typeKey];
        const mat = mats[Math.floor(rng() * mats.length)];

        const group = new THREE.Group();

        const geo = this.getGeo(baseW, scaledH, baseD);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, scaledH / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const yRotation = Math.floor(rng() * 4) * Math.PI / 2 + (rng() - 0.5) * 0.1;
        mesh.rotation.y = yRotation;

        group.add(mesh);

        if (height <= 15 && rng() > 0.3) {
          const roofH = 0.8 + rng() * 1.2;
          const roofGeo = this.createRoof(baseW + 0.4, baseD + 0.4, roofH);
          const roofMat = new THREE.MeshStandardMaterial({
            color: rng() > 0.5 ? 0x8b5e3c : 0x6b4c2c,
            roughness: 0.9,
            metalness: 0.02,
          });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.set(x, scaledH, z);
          roof.rotation.y = yRotation;
          roof.castShadow = true;
          group.add(roof);
        }

        if (dist < 80) {
          const edges = new THREE.EdgesGeometry(geo);
          const line = new THREE.LineSegments(edges, this.edgeMaterial);
          line.position.copy(mesh.position);
          line.rotation.y = yRotation;
          group.add(line);
        }

        this.scene.add(group);
        this.activeBuildings.set(i, group);
      }
    }

    for (const [key, group] of this.activeBuildings) {
      if (!needed.has(key)) {
        this.scene.remove(group);
        this.activeBuildings.delete(key);
      }
    }
  }
}
