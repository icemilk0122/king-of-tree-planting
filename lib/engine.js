import * as THREE from 'three';
import { MapTileManager, worldToLonLat, lonLatToWorld } from './map.js';
import { Character } from './character.js';
import { TreeManager } from './trees.js';
import { BuildingManager } from './buildings.js';
import { NpcManager } from './npcs.js';
import { FEATURES } from './features.js';
import { fetchWeather } from './weather.js';
import { PLAYER_POSITION_KEY, readPlayerPosition } from './game-session.js';
import { NPC_INTERACTION_SOURCE, shouldStartNpcInteraction } from './npc-interaction.js';

const CENTER_LAT = 25.0316;
const CENTER_LON = 121.5298;
const ZOOM = 17;

const CAMERA_MODES = {
  'high-angle': { distance: 25, height: 20, fov: 50, targetY: 8 },
  'isometric':  { distance: 35, height: 35, fov: 35, targetY: 4 },
  'top-down':   { distance: 5,  height: 50, fov: 40, targetY: 0 },
};
const CAMERA_MODE_ORDER = ['high-angle', 'isometric', 'top-down'];

export function initGame(container, coordEl, treeInfoEl, onTreeClick, onWeatherUpdate, onAddressUpdate, options = {}) {
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
  }

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
  const character = new Character(scene, { onAppearanceChange: options.onAppearanceChange });

  const initialPlayerCoords = options.initialPlayerCoords || readPlayerPosition(localStorage);
  if (initialPlayerCoords) {
    const { x, z } = lonLatToWorld(
      initialPlayerCoords.lng,
      initialPlayerCoords.lat,
      CENTER_LON,
      CENTER_LAT,
      ZOOM
    );
    character.group.position.x = x;
    character.group.position.z = z;
  }


  // Real tree data
  const treeManager = FEATURES.TREES
    ? new TreeManager(scene, CENTER_LON, CENTER_LAT, ZOOM)
    : null;
  if (treeManager) {
    treeManager.load();
    treeManager.loadHeritage();
  }

  // Building data
  const buildingManager = FEATURES.BUILDINGS
    ? new BuildingManager(scene, CENTER_LON, CENTER_LAT, ZOOM)
    : null;
  if (buildingManager) buildingManager.load();

  const npcManager = new NpcManager(scene, CENTER_LON, CENTER_LAT, ZOOM);
  npcManager.load();

  function interactWithNpc(npc, source) {
    if (!npc || inputBlocked || !shouldStartNpcInteraction(source)) return;
    options.onNpcInteract?.(npc);
  }

  // Input
  const keys = { up: false, down: false, left: false, right: false, rotLeft: false, rotRight: false };
  let analogRotSpeed = 0;
  let inputBlocked = false;

  function clearInput() {
    for (const key of Object.keys(keys)) keys[key] = false;
  }

  function onKeyDown(e) {
    if (inputBlocked) {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      return;
    }
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
      case 'Space':
        e.preventDefault();
        if (npcManager) {
          const npc = npcManager.getNpcAt(character.worldX, character.worldZ);
          if (npc) {
            interactWithNpc(npc, NPC_INTERACTION_SOURCE.KEYBOARD);
            break;
          }
        }
        if (treeManager && onTreeClick) {
          const tree = treeManager.getTreeAt(character.worldX, character.worldZ, 4);
          if (tree) onTreeClick(tree);
        }
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
    if (inputBlocked) return;
    cameraDistance = Math.max(5, Math.min(60, cameraDistance + e.deltaY * 0.03));
    const ratio = cameraMode.height / cameraMode.distance;
    cameraHeight = cameraDistance * ratio;
  }

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // Raycaster for NPC and tree click
  let onClick = null;
  if (npcManager || (FEATURES.TREE_CLICK_CARD && treeManager)) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const groundIntersect = new THREE.Vector3();

    onClick = (e) => {
      if (inputBlocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (npcManager) {
        const npcHit = raycaster.intersectObjects(npcManager.getRoots(), true)[0];
        const clickedNpc = npcHit ? npcManager.getNpcFromObject(npcHit.object) : null;
        const nearbyNpc = npcManager.getNpcAt(character.worldX, character.worldZ);
        if (clickedNpc && nearbyNpc?.id === clickedNpc.id) {
          interactWithNpc(clickedNpc, NPC_INTERACTION_SOURCE.WORLD);
          return;
        }
      }

      const hit = raycaster.ray.intersectPlane(groundPlane, groundIntersect);
      if (hit && treeManager) {
        const tree = treeManager.getTreeAt(groundIntersect.x, groundIntersect.z, 2);
        if (tree && onTreeClick) {
          onTreeClick(tree);
        }
      }
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
  let weatherData = null;
  let weatherSimEnabled = false;
  const defaultSkyColor = 0x87ceeb;
  const defaultSunIntensity = 1.0;
  const defaultExposure = 1.2;

  function applyWeatherVisuals(enabled) {
    if (!weatherData) return;
    if (enabled) {
      const skyColor = SKY_COLORS[weatherData.type] || SKY_COLORS.clear;
      scene.background = new THREE.Color(skyColor);
      if (scene.fog) scene.fog.color.set(skyColor);
      if (weatherData.type === 'overcast' || weatherData.type === 'cloudy') {
        sunLight.intensity = 0.7;
        renderer.toneMappingExposure = 0.9;
      } else if (weatherData.type === 'rain') {
        sunLight.intensity = 0.4;
        renderer.toneMappingExposure = 0.7;
      } else {
        sunLight.intensity = defaultSunIntensity;
        renderer.toneMappingExposure = defaultExposure;
      }
      if (weatherData.type === 'rain' && !rainSystem) {
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
          color: 0xaaccee, size: 0.15, transparent: true, opacity: 0.6,
        });
        const rain = new THREE.Points(geo, mat);
        scene.add(rain);
        rainSystem = { mesh: rain, positions, velocities, count };
      }
      if (rainSystem) rainSystem.mesh.visible = true;
    } else {
      scene.background = new THREE.Color(defaultSkyColor);
      if (scene.fog) scene.fog.color.set(defaultSkyColor);
      sunLight.intensity = defaultSunIntensity;
      renderer.toneMappingExposure = defaultExposure;
      if (rainSystem) rainSystem.mesh.visible = false;
    }
  }

  if (FEATURES.WEATHER) {
    fetchWeather().then((w) => {
      weatherData = w;
      if (onWeatherUpdate) onWeatherUpdate(w);
      applyWeatherVisuals(weatherSimEnabled);
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
    const { lon, lat } = worldToLonLat(
      character.worldX,
      character.worldZ,
      CENTER_LON,
      CENTER_LAT,
      ZOOM
    );
    lastGeoX = character.worldX;
    lastGeoZ = character.worldZ;
    reverseGeocode(lat, lon, onAddressUpdate);
  }

  // Saplings spawned by plant proposals
  const saplings = [];

  function createSapling(wx, wz) {
    const group = new THREE.Group();
    group.position.set(wx, 0, wz);

    // Tiny trunk
    const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    trunk.castShadow = true;
    group.add(trunk);

    // Small leaves
    const leavesGeo = new THREE.SphereGeometry(0.25, 6, 5);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.7 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 0.6;
    leaves.castShadow = true;
    group.add(leaves);

    // Yellow light pillar
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.8, 30, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd600,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 15;
    group.add(beam);

    // Inner bright core
    const coreGeo = new THREE.CylinderGeometry(0.08, 0.2, 30, 6, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffee58,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 15;
    group.add(core);

    // Ground glow ring
    const ringGeo = new THREE.RingGeometry(0.2, 1.2, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd600,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    // Sparkle particles
    const sparkCount = 20;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.5;
      sparkPos[i * 3] = Math.cos(angle) * r;
      sparkPos[i * 3 + 1] = Math.random() * 8;
      sparkPos[i * 3 + 2] = Math.sin(angle) * r;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfff176,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);

    scene.add(group);

    return { group, beam, core, ring, sparks, sparkPos, age: 0 };
  }

  function updateSaplings(dt) {
    for (const s of saplings) {
      s.age += dt;

      // Beam pulse
      const pulse = 0.15 + Math.sin(s.age * 2) * 0.05;
      s.beam.material.opacity = pulse;
      s.core.material.opacity = 0.3 + Math.sin(s.age * 3) * 0.1;

      // Ring pulse
      s.ring.material.opacity = 0.25 + Math.sin(s.age * 2.5) * 0.1;
      s.ring.scale.set(1 + Math.sin(s.age * 1.5) * 0.15, 1 + Math.sin(s.age * 1.5) * 0.15, 1);

      // Rising sparkles
      const pos = s.sparkPos;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += dt * (1 + Math.random());
        if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = 0;
      }
      s.sparks.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Animation
  const timer = new THREE.Timer();
  let lastMapUpdate = 0;
  let lastTreeUpdate = 0;
  let hudCounter = 0;
  let animId = null;
  let nearbyNpcId = null;

  function animate() {
    animId = requestAnimationFrame(animate);
    timer.update();
    const dt = timer.getDelta();

    if (!inputBlocked && keys.rotLeft) cameraAngle -= 0.03;
    if (!inputBlocked && keys.rotRight) cameraAngle += 0.03;
    if (!inputBlocked && analogRotSpeed) cameraAngle += analogRotSpeed;

    if (!inputBlocked && (keys.up || keys.down || keys.left || keys.right)) {
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

    npcManager.update(dt);

    sunLight.position.set(character.worldX + 50, 80, character.worldZ + 30);
    sunLight.target.position.set(character.worldX, 0, character.worldZ);

    lastMapUpdate += dt;
    if (mapManager && lastMapUpdate > 0.5) {
      mapManager.update(character.worldX, character.worldZ);
      lastMapUpdate = 0;
    }

    lastTreeUpdate += dt;
    if (lastTreeUpdate > 0.3) {
      if (treeManager) {
        treeManager.update(character.worldX, character.worldZ);
        treeManager.updateHeritage(character.worldX, character.worldZ);
      }
      if (buildingManager) buildingManager.update(character.worldX, character.worldZ);
      lastTreeUpdate = 0;
    }

    if (treeManager) treeManager.animateHeritage(timer.getElapsed());

    hudCounter++;
    if (hudCounter % 10 === 0) {
      const nearbyNpc = npcManager.getNpcAt(character.worldX, character.worldZ);
      const nextNpcId = nearbyNpc?.id || null;
      if (nextNpcId !== nearbyNpcId) {
        nearbyNpcId = nextNpcId;
        options.onNpcProximityChange?.(nearbyNpc || null);
      }
    }

    if (FEATURES.TREE_PROXIMITY_INFO && treeManager && treeInfoEl && hudCounter % 10 === 0) {
      const npcNearby = npcManager.getNpcAt(character.worldX, character.worldZ);
      const nearby = treeManager.getTreeAt(character.worldX, character.worldZ, 4);
      if (nearby && !npcNearby) {
        treeInfoEl.textContent = `❗ ${nearby.species}｜按 Space 或點擊查看任務`;
        treeInfoEl.style.borderColor = 'rgba(255,214,0,0.6)';
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
      if (hudCounter % 120 === 0) {
        try { localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify({ lat, lng: lon })); } catch {}
      }
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

    if (rainSystem && rainSystem.mesh.visible) {
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

    updateSaplings(dt);

    renderer.render(scene, camera);
  }

  if (mapManager) mapManager.update(0, 0);
  animate();

  const api = {
    getVisibleTreeIds() {
      if (!treeManager) return [];
      const ids = [];
      for (const [, group] of treeManager.activeTrees) {
        if (group.userData.treeId) ids.push(group.userData.treeId);
      }
      return ids;
    },
    getVisibleTrees() {
      if (!treeManager) return [];
      const trees = [];
      for (const [, group] of treeManager.activeTrees) {
        const d = group.userData;
        if (d.treeId) trees.push({ treeId: d.treeId, species: d.species, region: d.region, diameter: d.diameter });
      }
      return trees;
    },
    setQuestTreeIds(ids) {
      if (treeManager) treeManager.setQuestTreeIds(ids);
    },
    addQuestTreeId(id) {
      if (treeManager) treeManager.addQuestTreeId(id);
    },
    removeQuestTreeId(id) {
      if (treeManager) treeManager.removeQuestTreeId(id);
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
      if (treeManager) {
        treeManager.update(x, z);
        treeManager.updateHeritage(x, z);
      }
      if (buildingManager) buildingManager.update(x, z);
      nearbyNpcId = null;
      if (onAddressUpdate) {
        lastGeoX = x;
        lastGeoZ = z;
        reverseGeocode(lat, lon, onAddressUpdate);
      }
    },
    getTreeWorldPos(treeId) {
      const treePosition = treeManager?.getTreeWorldPos(treeId);
      if (treePosition) return treePosition;
      return npcManager.getTreeWorldPos(treeId);
    },
    getTreeData(treeId) {
      return treeManager?.getTreeData(treeId) || null;
    },
    getNpcWorldPos(npcId) {
      return npcManager.getNpcWorldPos(npcId);
    },
    getPlayerWorldPos() {
      return { x: character.group.position.x, z: character.group.position.z };
    },
    async changeEquip(equipId) {
      return character?.changeEquip ? character.changeEquip(equipId) : null;
    },
    removeEquip(slot) {
      return character?.removeEquip ? character.removeEquip(slot) : null;
    },
    async applyOutfit(outfit) {
      return character?.applyOutfit ? character.applyOutfit(outfit) : null;
    },
    getOutfit() {
      return character?.getOutfit?.() || {};
    },
    setWeatherSimEnabled(enabled) {
      weatherSimEnabled = !!enabled;
      applyWeatherVisuals(weatherSimEnabled);
    },
    spawnSapling() {
      const s = createSapling(character.worldX, character.worldZ);
      saplings.push(s);
    },
    setJoystickInput(dx, dy) {
      if (inputBlocked) {
        clearInput();
        return;
      }
      keys.up = dy < -0.2;
      keys.down = dy > 0.2;
      keys.left = dx < -0.2;
      keys.right = dx > 0.2;
    },
    setAnalogRotation(speed) {
      analogRotSpeed = inputBlocked ? 0 : speed;
    },
    resetCamera() {
      cameraAngle = 0;
    },
    setInputBlocked(blocked) {
      inputBlocked = !!blocked;
      if (inputBlocked) clearInput();
    },
    getAppearanceState() {
      return character?.getAppearanceState?.() || null;
    },
    cleanup() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (onClick) renderer.domElement.removeEventListener('click', onClick);
      npcManager?.cleanup?.();
      character?.cleanup?.();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
  return api;
}
