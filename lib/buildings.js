import * as THREE from 'three';
import { lonLatToWorld } from './map.js';

const VIEW_RADIUS = 150;
const BUILDING_COLOR = 0xc8bfb0;
const BUILDING_EDGE_COLOR = 0xa09888;

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

    this.material = new THREE.MeshStandardMaterial({
      color: BUILDING_COLOR,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.edgeMaterial = new THREE.LineBasicMaterial({ color: BUILDING_EDGE_COLOR, transparent: true, opacity: 0.4 });

    this.geoCache = new Map();
  }

  getGeo(h) {
    const key = Math.round(h);
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(4, key, 4));
    }
    return this.geoCache.get(key);
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
        const scaledH = height * 0.4;

        const geo = this.getGeo(scaledH);
        const mesh = new THREE.Mesh(geo, this.material);
        mesh.position.set(x, scaledH / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, this.edgeMaterial);
        line.position.copy(mesh.position);

        const group = new THREE.Group();
        group.add(mesh);
        group.add(line);

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
