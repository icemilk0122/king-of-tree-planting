export const NPC_PLACEMENTS = Object.freeze([
  Object.freeze({
    id: 'guide-ashu',
    characterId: 'guide-ashu',
    name: '阿樹',
    locationLabel: '永康公園導覽點',
    modelPath: '/models/npc-guide-ashu.glb',
    lat: 25.0317,
    lng: 121.5298,
    arrivalLat: 25.0316,
    arrivalLng: 121.5298,
    districtKey: 'daan',
    interactionRadius: 5.5,
    storyEvent: 'guide.opening_replayed',
    storySceneId: 'S00_OPENING',
  }),
  Object.freeze({
    id: 'neighborhood-aunt',
    characterId: 'neighborhood-aunt',
    name: '街坊阿姨',
    locationLabel: '永康街買菜路線',
    modelPath: '/models/npc-neighborhood-aunt.glb',
    lat: 25.0298,
    lng: 121.5306,
    arrivalLat: 25.0297,
    arrivalLng: 121.5306,
    districtKey: 'daan',
    interactionRadius: 5.5,
    storyEvent: 'neighborhood.story_opened',
    storySceneId: 'S24_LOCAL_NEIGHBORHOOD',
  }),
  Object.freeze({
    id: 'heritage-tree-557',
    characterId: 'heritage-tree-557',
    name: '永康街樟樹',
    locationLabel: '永康街13巷6號旁停車場',
    modelPath: '/models/npc-heritage-557.glb',
    mapIcon: '🌳',
    markerKind: 'quest',
    lat: 25.0327,
    lng: 121.5303,
    arrivalLat: 25.0326,
    arrivalLng: 121.5303,
    districtKey: 'daan',
    interactionRadius: 6,
    storyEvent: 'tree.interacted',
    storySceneId: 'S13_HERITAGE_557',
    treeId: 'heritage-557',
    tree: Object.freeze({
      treeId: 'heritage-557',
      species: '樟樹',
      region: '永康街13巷6號旁停車場',
      regionRemark: '臺北市受保護樹木編號 557',
      surveyDate: '',
      diameter: 0,
      height: 0,
      dist: '大安區',
    }),
  }),
  Object.freeze({
    id: 'heritage-tree-763',
    characterId: 'heritage-tree-763',
    name: '麗水街麵包樹',
    locationLabel: '麗水街9巷13號旁',
    modelPath: '/models/npc-heritage-763.glb',
    mapIcon: '🌳',
    markerKind: 'quest',
    lat: 25.0306,
    lng: 121.5293,
    arrivalLat: 25.0305,
    arrivalLng: 121.5293,
    districtKey: 'daan',
    interactionRadius: 6,
    storyEvent: 'tree.interacted',
    storySceneId: 'S14_HERITAGE_763',
    treeId: 'heritage-763',
    tree: Object.freeze({
      treeId: 'heritage-763',
      species: '麵包樹',
      region: '麗水街9巷13號旁',
      regionRemark: '臺北市受保護樹木編號 763',
      surveyDate: '',
      diameter: 60,
      height: 12.1,
      dist: '大安區',
    }),
  }),
]);

export function getNpcPlacement(id) {
  return NPC_PLACEMENTS.find(item => item.id === id) || null;
}

export function getNpcPlacementsForDistrict(districtKey) {
  return NPC_PLACEMENTS.filter(item => !districtKey || item.districtKey === districtKey);
}

export function createNpcNavigationTarget(npc) {
  return {
    id: `story:${npc.id}`,
    kind: 'npc-story',
    npc_id: npc.id,
    npc_name: npc.name,
    title: npc.name,
    description: npc.locationLabel,
    icon: npc.mapIcon || '💬',
    npc,
  };
}
