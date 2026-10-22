import * as THREE from 'three';
import { MapTileManager, worldToLonLat } from './map.js';
import { Character } from './character.js';
import { TreeManager } from './trees.js';

const CENTER_LAT = 25.0330;
const CENTER_LON = 121.5654;
const ZOOM = 17;

export function initGame(container, coordEl, treeInfoEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 200, 500);

  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  let cameraAngle = 0;
  let cameraDistance = 25;
  let cameraHeight = 20;
  const cameraTargetOffset = new THREE.Vector3(0, 8, 0);

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

  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4));

  // Map & Character
  const mapManager = new MapTileManager(scene, CENTER_LON, CENTER_LAT, ZOOM);
  const character = new Character(scene);

  // Real tree data
  const treeManager = new TreeManager(scene, CENTER_LON, CENTER_LAT, ZOOM);
  treeManager.load();

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
    cameraDistance = Math.max(10, Math.min(60, cameraDistance + e.deltaY * 0.03));
    cameraHeight = cameraDistance * 0.8;
  }

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('wheel', onWheel);
  window.addEventListener('resize', onResize);

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
    if (lastMapUpdate > 0.5) {
      mapManager.update(character.worldX, character.worldZ);
      lastMapUpdate = 0;
    }

    lastTreeUpdate += dt;
    if (lastTreeUpdate > 0.3) {
      treeManager.update(character.worldX, character.worldZ);
      lastTreeUpdate = 0;
    }

    // Tree proximity check
    hudCounter++;
    if (treeInfoEl && hudCounter % 10 === 0) {
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

    renderer.render(scene, camera);
  }

  mapManager.update(0, 0);
  animate();

  return {
    cleanup() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
