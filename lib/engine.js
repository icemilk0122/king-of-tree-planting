import * as THREE from 'three';
import { MapTileManager, worldToLonLat, lonLatToWorld } from './map.js';
import { Character } from './character.js';
import { TreeManager } from './trees.js';
import { BuildingManager } from './buildings.js';
import { FEATURES } from './features.js';
import { fetchWeather } from './weather.js';

const CENTER_LAT = 25.0330;
const CENTER_LON = 121.5654;
const ZOOM = 17;

const CAMERA_MODES = {
  'high-angle': { distance: 25, height: 20, fov: 50, targetY: 8, label: '高角度 High Angle' },
  'isometric':  { distance: 35, height: 35, fov: 35, targetY: 4, label: '等角 Isometric 45°' },
  'top-down':   { distance: 5,  height: 50, fov: 40, targetY: 0, label: '俯瞰 Top-Down' },
};
const CAMERA_MODE_ORDER = ['high-angle', 'isometric', 'top-down'];

export function initGame(container, coordEl, treeInfoEl, onTreeClick, onWeatherUpdate, onAddressUpdate, onCameraModeChange) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = FEATURES.SHADOWS;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  if (FEATURES.FOG) scene.fog = new THREE.Fog(0x87ceeb, 200, 500);

  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  let cameraAngle = 0;
  let cameraModeIndex = 1;
  let cameraMode = CAMERA_MODES[CAMERA_MODE_ORDER[1]];
  let cameraDistance = cameraMode.distance;
  let cameraHeight = cameraMode.height;
  const cameraTargetOffset = new THREE.Vector3(0, cameraMode.targetY, 0);
  camera.fov = cameraMode.fov;
  camera.updateProjectionMatrix();

  function setCameraMode(index) {
    cameraModeIndex = index;
    const mode = CAMERA_MODES[CAMERA_MODE_ORDER[index]];
    cameraMode = mode;
    cameraDistance = mode.distance;
    cameraHeight = mode.height;
    cameraTargetOffset.y = mode.targetY;
    camera.fov = mode.fov;
    camera.updateProjectionMatrix();
    if (onCameraModeChange) onCameraModeChange(mode.label);
  }

  if (onCameraModeChange) onCameraModeChange(cameraMode.label);

  function updateCamera(target) {
    const cx = target.x + Math.sin(cameraAngle) * cameraDistance;
    const cz = target.z + Math.cos(cameraAngle) * cameraDistance;
    camera.position.set(cx, cameraHeight, cz);
    camera.lookAt(
      target.x + cameraTargetOffset.x,
      cameraTargetOffset.y,
      target.z + cameraTargetOffset.z
    );
  }

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  sunLight.position.set(50, 80, 30);
  sunLight.castShadow = FEATURES.SHADOWS;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);
  scene.add(sunLight.target);

  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4));

  // Map & Character
  const mapManager = FEATURES.MAP_TILES
    ? new MapTileManager(scene, CENTER_LON, CENTER_LAT, ZOOM)
    : null;
  const character = new Character(scene);

  // Real tree data
  const treeManager = FEATURES.TREES
    ? new TreeManager(scene, CENTER_LON, CENTER_LAT, ZOOM)
    : null;
  if (treeManager) treeManager.load();

  // Building data
  const buildingManager = FEATURES.BUILDINGS
    ? new BuildingManager(scene, CENTER_LON, CENTER_LAT, ZOOM)
    : null;
  if (buildingManager) buildingManager.load();

  // Input
  const keys = { up: false, down: false, left: false, right: false, rotLeft: false, rotRight: false };

  function onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': keys.up = true; break;
      case 'KeyS': case 'ArrowDown': keys.down = true; break;
      case 'KeyA': case 'ArrowLeft': keys.left = true; break;
      case 'KeyD': case 'ArrowRight': keys.right = true; break;
      case 'KeyQ': keys.rotLeft = true; break;
      case 'KeyE': keys.rotRight = true; break;
      case 'KeyV':
        setCameraMode((cameraModeIndex + 1) % CAMERA_MODE_ORDER.length);
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': keys.up = false; break;
      case 'KeyS': case 'ArrowDown': keys.down = false; break;
      case 'KeyA': case 'ArrowLeft': keys.left = false; break;
      case 'KeyD': case 'ArrowRight': keys.right = false; break;
      case 'KeyQ': keys.rotLeft = false; break;
      case 'KeyE': keys.rotRight = false; break;
    }
  }

  function onWheel(e) {
    cameraDistance = Math.max(5, Math.min(60, cameraDistance + e.deltaY * 0.03));
    const ratio = cameraMode.height / cameraMode.distance;
    cameraHeight = cameraDistance * ratio;
  }

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // Raycaster for tree click
  let onClick = null;
  if (FEATURES.TREE_CLICK_CARD && treeManager) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const groundIntersect = new THREE.Vector3();

    onClick = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.ray.intersectPlane(groundPlane, groundIntersect);
      if (hit) {
        const tree = treeManager.getTreeAt(groundIntersect.x, groundIntersect.z, 5);
        if (tree && onTreeClick) {
          onTreeClick(tree);
          return;
        }
      }
      if (onTreeClick) onTreeClick(null);
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('wheel', onWheel);
  window.addEventListener('resize', onResize);
  if (onClick) renderer.domElement.addEventListener('click', onClick);

  // Weather effects
  const SKY_COLORS = {
    clear: 0x87ceeb,
    cloudy: 0x9cb0c4,
    overcast: 0x7a8a96,
    rain: 0x5a6a76,
  };
  let rainSystem = null;

  if (FEATURES.WEATHER) {
    fetchWeather().then((w) => {
      if (onWeatherUpdate) onWeatherUpdate(w);

      const skyColor = SKY_COLORS[w.type] || SKY_COLORS.clear;
      scene.background = new THREE.Color(skyColor);
      if (scene.fog) scene.fog.color.set(skyColor);

      if (w.type === 'overcast' || w.type === 'cloudy') {
        sunLight.intensity = 0.7;
        renderer.toneMappingExposure = 0.9;
      }

      if (w.type === 'rain') {
        sunLight.intensity = 0.4;
        renderer.toneMappingExposure = 0.7;

        const count = 3000;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 120;
          positions[i * 3 + 1] = Math.random() * 60;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
          velocities[i] = 0.4 + Math.random() * 0.3;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
          color: 0xaaccee,
          size: 0.15,
          transparent: true,
          opacity: 0.6,
        });
        const rain = new THREE.Points(geo, mat);
        scene.add(rain);
        rainSystem = { mesh: rain, positions, velocities, count };
      }
    });
  }

  // Reverse geocoding
  let lastGeoX = Infinity;
  let lastGeoZ = Infinity;
  let geoInFlight = false;

  function reverseGeocode(lat, lon, cb) {
    if (geoInFlight) return;
    geoInFlight = true;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW&zoom=18&addressdetails=1`)
      .then(r => r.json())
      .then(data => {
        const a = data.address || {};
        const road = a.road || a.pedestrian || a.footway || '';
        const num = a.house_number || '';
        const street = road + (num ? num + '號' : '');
        const hood = a.neighbourhood || '';
        const district = a.suburb || a.city_district || '';
        const city = a.city || a.town || '';
        const postcode = a.postcode || '';
        const parts = [postcode, city, district, hood, street].filter(Boolean);
        const addr = parts.join('');
        cb(addr);
      })
      .catch(() => {})
      .finally(() => { geoInFlight = false; });
  }

  // Initial geocode
  if (onAddressUpdate) {
    const { lon, lat } = worldToLonLat(0, 0, CENTER_LON, CENTER_LAT, ZOOM);
    lastGeoX = 0;
    lastGeoZ = 0;
    reverseGeocode(lat, lon, onAddressUpdate);
  }

  // Animation
  const timer = new THREE.Timer();
  let lastMapUpdate = 0;
  let lastTreeUpdate = 0;
  let hudCounter = 0;
  let animId = null;

  function animate() {
    animId = requestAnimationFrame(animate);
    timer.update();
    const dt = timer.getDelta();

    if (keys.rotLeft) cameraAngle -= 0.03;
    if (keys.rotRight) cameraAngle += 0.03;

    if (keys.up || keys.down || keys.left || keys.right) {
      let mx = 0, mz = 0;
      if (keys.up) mz -= 1;
      if (keys.down) mz += 1;
      if (keys.left) mx -= 1;
      if (keys.right) mx += 1;

      const cos = Math.cos(cameraAngle);
      const sin = Math.sin(cameraAngle);
      const rx = mx * cos - mz * sin;
      const rz = mx * sin + mz * cos;

      const camRelKeys = { up: false, down: false, left: false, right: false };
      if (rz < -0.1) camRelKeys.up = true;
      if (rz > 0.1) camRelKeys.down = true;
      if (rx < -0.1) camRelKeys.left = true;
      if (rx > 0.1) camRelKeys.right = true;

      character.update(dt, camRelKeys);
    } else {
      character.update(dt, { up: false, down: false, left: false, right: false });
    }

    sunLight.position.set(character.worldX + 50, 80, character.worldZ + 30);
    sunLight.target.position.set(character.worldX, 0, character.worldZ);

    lastMapUpdate += dt;
    if (mapManager && lastMapUpdate > 0.5) {
      mapManager.update(character.worldX, character.worldZ);
      lastMapUpdate = 0;
    }

    lastTreeUpdate += dt;
    if (lastTreeUpdate > 0.3) {
      if (treeManager) treeManager.update(character.worldX, character.worldZ);
      if (buildingManager) buildingManager.update(character.worldX, character.worldZ);
      lastTreeUpdate = 0;
    }

    hudCounter++;
    if (FEATURES.TREE_PROXIMITY_INFO && treeManager && treeInfoEl && hudCounter % 10 === 0) {
      const nearby = treeManager.getTreeAt(character.worldX, character.worldZ, 4);
      if (nearby) {
        treeInfoEl.textContent = `🌳 ${nearby.species}｜胸徑 ${nearby.diameter}cm｜樹高 ${nearby.height}m`;
        treeInfoEl.style.opacity = '1';
      } else {
        treeInfoEl.style.opacity = '0';
      }
    }

    updateCamera(character.group.position);

    if (coordEl && hudCounter % 15 === 0) {
      const { lon, lat } = worldToLonLat(
        character.worldX, character.worldZ, CENTER_LON, CENTER_LAT, ZOOM
      );
      coordEl.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    if (onAddressUpdate && hudCounter % 120 === 0) {
      const dx = character.worldX - lastGeoX;
      const dz = character.worldZ - lastGeoZ;
      if (dx * dx + dz * dz > 400) {
        lastGeoX = character.worldX;
        lastGeoZ = character.worldZ;
        const { lon, lat } = worldToLonLat(
          character.worldX, character.worldZ, CENTER_LON, CENTER_LAT, ZOOM
        );
        reverseGeocode(lat, lon, onAddressUpdate);
      }
    }

    if (rainSystem) {
      const pos = rainSystem.positions;
      for (let i = 0; i < rainSystem.count; i++) {
        pos[i * 3 + 1] -= rainSystem.velocities[i];
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 50 + Math.random() * 10;
          pos[i * 3] = character.worldX + (Math.random() - 0.5) * 120;
          pos[i * 3 + 2] = character.worldZ + (Math.random() - 0.5) * 120;
        }
      }
      rainSystem.mesh.geometry.attributes.position.needsUpdate = true;
      rainSystem.mesh.position.set(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  if (mapManager) mapManager.update(0, 0);
  animate();

  return {
    getVisibleTreeIds() {
      if (!treeManager) return [];
      const ids = [];
      for (const [, group] of treeManager.activeTrees) {
        if (group.userData.treeId) ids.push(group.userData.treeId);
      }
      return ids;
    },
    getPlayerCoords() {
      const { lon, lat } = worldToLonLat(character.worldX, character.worldZ, CENTER_LON, CENTER_LAT, ZOOM);
      return { lat, lng: lon };
    },
    teleport(lat, lon) {
      const { x, z } = lonLatToWorld(lon, lat, CENTER_LON, CENTER_LAT, ZOOM);
      character.group.position.x = x;
      character.group.position.z = z;
      if (mapManager) mapManager.update(x, z);
      if (treeManager) treeManager.update(x, z);
      if (buildingManager) buildingManager.update(x, z);
      if (onAddressUpdate) {
        lastGeoX = x;
        lastGeoZ = z;
        reverseGeocode(lat, lon, onAddressUpdate);
      }
    },
    cleanup() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (onClick) renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
