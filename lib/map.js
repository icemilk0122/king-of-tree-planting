import * as THREE from 'three';

const TILE_SIZE = 256;
const WORLD_TILE_SIZE = 100;

export function lonLatToTile(lon, lat, zoom) {
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

export function tileToLonLat(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lon, lat };
}

export function lonLatToWorld(lon, lat, centerLon, centerLat, zoom) {
  const center = lonLatToTile(centerLon, centerLat, zoom);
  const point = lonLatToTile(lon, lat, zoom);
  return {
    x: (point.x - center.x) * WORLD_TILE_SIZE,
    z: (point.y - center.y) * WORLD_TILE_SIZE,
  };
}

export function worldToLonLat(wx, wz, centerLon, centerLat, zoom) {
  const center = lonLatToTile(centerLon, centerLat, zoom);
  const tileX = center.x + wx / WORLD_TILE_SIZE;
  const tileY = center.y + wz / WORLD_TILE_SIZE;
  return tileToLonLat(tileX, tileY, zoom);
}

export class MapTileManager {
  constructor(scene, centerLon, centerLat, zoom = 17) {
    this.scene = scene;
    this.centerLon = centerLon;
    this.centerLat = centerLat;
    this.zoom = zoom;
    this.tiles = new Map();
    this.loader = new THREE.TextureLoader();
    this.loader.crossOrigin = 'anonymous';
    this.radius = 4;
  }

  getTileUrl(tx, ty) {
    const subdomains = ['a', 'b', 'c'];
    const s = subdomains[(tx + ty) % subdomains.length];
    return `https://${s}.tile.openstreetmap.org/${this.zoom}/${tx}/${ty}.png`;
  }

  tileKey(tx, ty) {
    return `${tx},${ty}`;
  }

  update(worldX, worldZ) {
    const center = lonLatToTile(this.centerLon, this.centerLat, this.zoom);
    const currentTileX = Math.floor(center.x + worldX / WORLD_TILE_SIZE);
    const currentTileY = Math.floor(center.y + worldZ / WORLD_TILE_SIZE);

    const needed = new Set();
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        const tx = currentTileX + dx;
        const ty = currentTileY + dy;
        const key = this.tileKey(tx, ty);
        needed.add(key);
        if (!this.tiles.has(key)) {
          this.loadTile(tx, ty);
        }
      }
    }

    for (const [key, tile] of this.tiles) {
      if (!needed.has(key)) {
        this.scene.remove(tile.mesh);
        if (tile.mesh.material.map) tile.mesh.material.map.dispose();
        tile.mesh.material.dispose();
        tile.mesh.geometry.dispose();
        this.tiles.delete(key);
      }
    }
  }

  loadTile(tx, ty) {
    const key = this.tileKey(tx, ty);
    const center = lonLatToTile(this.centerLon, this.centerLat, this.zoom);

    const worldX = (tx - center.x + 0.5) * WORLD_TILE_SIZE;
    const worldZ = (ty - center.y + 0.5) * WORLD_TILE_SIZE;

    const geo = new THREE.PlaneGeometry(WORLD_TILE_SIZE, WORLD_TILE_SIZE);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x556655,
      roughness: 0.9,
      metalness: 0.0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(worldX, 0, worldZ);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.tiles.set(key, { mesh, tx, ty });

    const url = this.getTileUrl(tx, ty);
    this.loader.load(
      url,
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        mat.map = texture;
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
      },
      undefined,
      () => {
        mat.color.set(0x445544);
      }
    );
  }
}
