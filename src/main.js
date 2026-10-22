import * as THREE from 'three';
import { MapTileManager, worldToLonLat } from './map.js';
import { Character } from './character.js';

// Taipei 101 area
const CENTER_LAT = 25.0330;
const CENTER_LON = 121.5654;
const ZOOM = 17;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 200, 500);

// Camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraAngle = 0;
let cameraDistance = 25;
let cameraHeight = 20;
const cameraTargetOffset = new THREE.Vector3(0, 8, 0);

function updateCamera(target) {
  const cx = target.x + Math.sin(cameraAngle) * cameraDistance;
  const cz = target.z + Math.cos(cameraAngle) * cameraDistance;
  camera.position.set(cx, cameraHeight, cz);
  camera.lookAt(target.x + cameraTargetOffset.x, cameraTargetOffset.y, target.z + cameraTargetOffset.z);
}

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
sunLight.position.set(50, 80, 30);
sunLight.castShadow = true;
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

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
scene.add(hemisphereLight);

// Map
const mapManager = new MapTileManager(scene, CENTER_LON, CENTER_LAT, ZOOM);

// Character
const character = new Character(scene);

// Place some decorative trees
function createTree(x, z) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const leavesGeo = new THREE.SphereGeometry(1.2, 8, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 2.8;
  leaves.castShadow = true;
  group.add(leaves);

  group.position.set(x, 0, z);
  const s = 0.8 + Math.random() * 0.6;
  group.scale.set(s, s, s);
  scene.add(group);
  return group;
}

// Scatter some trees
for (let i = 0; i < 40; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 10 + Math.random() * 80;
  createTree(Math.cos(angle) * dist, Math.sin(angle) * dist);
}

// Keyboard input
const keys = { up: false, down: false, left: false, right: false, rotLeft: false, rotRight: false };

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': keys.up = true; break;
    case 'KeyS': case 'ArrowDown': keys.down = true; break;
    case 'KeyA': case 'ArrowLeft': keys.left = true; break;
    case 'KeyD': case 'ArrowRight': keys.right = true; break;
    case 'KeyQ': keys.rotLeft = true; break;
    case 'KeyE': keys.rotRight = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': keys.up = false; break;
    case 'KeyS': case 'ArrowDown': keys.down = false; break;
    case 'KeyA': case 'ArrowLeft': keys.left = false; break;
    case 'KeyD': case 'ArrowRight': keys.right = false; break;
    case 'KeyQ': keys.rotLeft = false; break;
    case 'KeyE': keys.rotRight = false; break;
  }
});

// Scroll to zoom
window.addEventListener('wheel', (e) => {
  cameraDistance = Math.max(10, Math.min(60, cameraDistance + e.deltaY * 0.03));
  cameraHeight = cameraDistance * 0.8;
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// HUD
const coordDisplay = document.getElementById('coord-display');
let hudUpdateCounter = 0;

// Animation loop
const timer = new THREE.Timer();
let lastMapUpdate = 0;

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const dt = timer.getDelta();

  // Camera rotation
  if (keys.rotLeft) cameraAngle -= 0.03;
  if (keys.rotRight) cameraAngle += 0.03;

  // Movement relative to camera
  const moveKeys = {
    up: keys.up,
    down: keys.down,
    left: keys.left,
    right: keys.right,
  };

  // Transform movement direction based on camera angle
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

    const camRelKeys = {
      up: false, down: false, left: false, right: false,
    };
    if (rz < -0.1) camRelKeys.up = true;
    if (rz > 0.1) camRelKeys.down = true;
    if (rx < -0.1) camRelKeys.left = true;
    if (rx > 0.1) camRelKeys.right = true;

    character.update(dt, camRelKeys);
  } else {
    character.update(dt, { up: false, down: false, left: false, right: false });
  }

  // Update sun position relative to character
  sunLight.position.set(
    character.worldX + 50,
    80,
    character.worldZ + 30
  );
  sunLight.target.position.set(character.worldX, 0, character.worldZ);

  // Update map tiles
  lastMapUpdate += dt;
  if (lastMapUpdate > 0.5) {
    mapManager.update(character.worldX, character.worldZ);
    lastMapUpdate = 0;
  }

  // Update camera
  updateCamera(character.group.position);

  // Update HUD
  hudUpdateCounter++;
  if (hudUpdateCounter % 15 === 0) {
    const { lon, lat } = worldToLonLat(
      character.worldX, character.worldZ,
      CENTER_LON, CENTER_LAT, ZOOM
    );
    coordDisplay.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  renderer.render(scene, camera);
}

// Initial map load
mapManager.update(0, 0);
animate();
