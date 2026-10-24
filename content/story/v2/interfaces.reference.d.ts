/**
 * 審閱用介面建議，未整合、未執行 tsc；不宣稱目前 JS 已實作。
 * 目標：保留現有 initGame 七參數、quest-engine 回傳既有欄位；僅加可選接口。
 * 不能把此檔直接放入專案就視為功能完成。
 */
export type EquipSlot = 'hair' | 'hat' | 'top' | 'bottom' | 'shoes' | 'acc';
export type OutfitSlots = Readonly<Record<EquipSlot, string | null>>;
export interface OutfitSaveV2 {
  schemaVersion: 2;
  slots: OutfitSlots; // null=明確脫下；不存在存檔才套全套預設。
}
export type EquipErrorCode =
  | 'INVALID_SLOT' | 'UNKNOWN_EQUIPMENT' | 'SLOT_MISMATCH'
  | 'BASE_NOT_READY' | 'ASSET_MISSING' | 'LOAD_FAILED'
  | 'EMPTY_MODEL' | 'RIG_INCOMPATIBLE' | 'DISPOSED';
export interface SlotAppearance {
  requestedId: string | null;
  appliedId: string | null;
  phase: 'idle' | 'loading' | 'applied' | 'error' | 'unavailable';
  requestVersion: number;
  errorCode?: EquipErrorCode;
}
export interface AppearanceSnapshot {
  instanceId: string;
  base: 'loading' | 'ready' | 'fallback' | 'disposed';
  slots: Readonly<Record<EquipSlot, SlotAppearance>>;
  persistence: 'clean' | 'dirty' | 'failed';
}
export type EquipResult =
  | { status: 'applied' | 'unchanged'; slot: EquipSlot; appliedId: string | null;
      persisted: boolean; snapshot: AppearanceSnapshot }
  | { status: 'superseded'; slot: EquipSlot; requestVersion: number }
  | { status: 'rejected'; slot: EquipSlot; code: EquipErrorCode;
      message: string; snapshot: AppearanceSnapshot };
export interface EngineAppearanceExtension {
  changeEquip(slot: EquipSlot, equipmentId: string): Promise<EquipResult>;
  removeEquip(slot: EquipSlot): Promise<EquipResult>;
  getOutfit(): OutfitSlots; // 已套用快照，不是載入中的期望值。
  getAppearanceState(): AppearanceSnapshot;
  setInputBlocked(blocked: boolean): void;
  cleanup(): void;
}
export interface InitGameOptions {
  onAppearanceChange?: (snapshot: AppearanceSnapshot) => void;
}
/** 建議放在原 initGame 七參數後的可選第八參數；不是重寫七參數型別。 */
export type OptionalEighthArgument = InitGameOptions | undefined;

export interface CommittedPhotoResult {
  points: number; // 保留原 API
  totalPoints: number; // 保留原 API
  questId: string;
  treeId: string;
  participationId: string;
  ledgerId: string;
}
export interface SavedLocalProposal {
  id: string;
  lat: number;
  lng: number;
  reason: string;
  photo_url: string | null;
  area_id?: string;
  status: 'local';
  created_at: string;
  location_source?: 'game-player' | 'explicit-map-selection';
  evidence_kind?: 'planting_site';
  client_request_id?: string;
}
export interface EventMeta {
  eventId: string; // runId:type:businessRecordId，或明確穩定的 UI 事件 ID。
  runId: string;
  occurredAt: string;
  mode: 'local-demo' | 'connected';
}
export type LocalDomainEvent = EventMeta & (
  | { type: 'game.new_started'; entityId: string }
  | { type: 'tree.interacted'; entityId: string; treeId: string }
  | { type: 'area.entered'; entityId: string; areaId: string;
      precision: 'approximate' | 'explicit-district-jump' }
  | { type: 'proposal.tool_opened'; entityId: string }
  | { type: 'proposal.saved'; entityId: string; storageMode: 'local'; proposal: SavedLocalProposal }
  | ({ type: 'quest.local_reward_committed'; entityId: string;
      questKind: 'general' | 'special' } & CommittedPhotoResult)
  | { type: 'relay.local_reward_committed'; entityId: string;
      relayLegId: string; ledgerId: string; points: number }
  | { type: 'observation.saved'; entityId: string; treeId: string }
);
/** 未來正式資料接口。此欄位本身不構成可信性；來源驗證必須在權威服務完成。 */
export interface VerifiedStatusReference {
  sourceRecordId: string;
  sourceVersion: string;
  sourceUri: string;
  verifiedAt: string;
  authority: string;
}
export interface StoryProgressV1 {
  schemaVersion: 1;
  runId: string;
  completed: Record<string, { revision: number; completedAt: string }>;
  skipped: Record<string, { revision: number; skippedAt: string }>;
  consumedEventIds: string[];
  checkpoint?: { sceneId: string; pageId: string; eventId: string };
}
export interface PlayablePage {
  id: string;
  speaker: string;
  text: string;
  portrait: string | null;
  portraitEntrance: 'left' | 'right';
  overlay: number; // finite、0..1；不可使用 ||0.5 吃掉 0。
  uiHint?: string;
  photoBinding?: {
    source: 'heritage-catalog';
    treeId: `heritage-${number}`;
    resolver: 'localHeritagePhotos';
    neverFallbackToAnotherTree: true;
  };
}
export interface CampaignDraft {
  id: string;
  state: 'draft' | 'published' | 'closed';
  mode: 'local-demo' | 'official';
  startsAt: string | null; // publish 前必須有效、endsAt>startsAt
  endsAt: string | null;
  displayTimeZone: 'Asia/Taipei';
  evidenceKind: 'planting-proposal' | 'treehole-observation' | 'whole-tree-photo';
  officialSource?: VerifiedStatusReference;
}
/** 這些僅為型別契約；資源清理、去重、日期與信任驗證不可用型別取代。 */
