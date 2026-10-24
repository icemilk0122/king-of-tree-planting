import { supabase } from './supabase';
import { getDeviceId } from './device-id';
import { generateNpcName, generateDialogue } from './npc-names';
import { CURRENT_QUEST_CONTENT_VERSION } from './quest-version';

const GENERAL_POINTS = 10;
const SPECIAL_POINTS = 20;
const FRESHNESS_DAYS = 60;

export async function getOrCreateUser() {
  const deviceId = getDeviceId();
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('users')
    .upsert({ device_id: deviceId, display_name: `探索者${deviceId.slice(-4)}` }, { onConflict: 'device_id' })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function getActiveQuests(areaId) {
  let query = supabase
    .from('quests')
    .select('*')
    .eq('content_version', CURRENT_QUEST_CONTENT_VERSION)
    .eq('is_active', true)
    .eq('satisfied', false);
  if (areaId) query = query.eq('area_id', areaId);
  const { data, error } = await query.order('quest_type', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getQuestsForTree(treeId) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('tree_id', treeId)
    .eq('content_version', CURRENT_QUEST_CONTENT_VERSION)
    .eq('is_active', true)
    .eq('satisfied', false);
  if (error) throw error;
  return data || [];
}

export async function acceptQuest(questId) {
  const user = await getOrCreateUser();
  const { data, error } = await supabase
    .from('participations')
    .upsert(
      { quest_id: questId, user_id: user.id, status: 'pending' },
      { onConflict: 'user_id,quest_id', ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: existing, error: fetchError } = await supabase
    .from('participations')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', user.id)
    .single();
  if (fetchError) throw fetchError;
  return existing;
}

export async function submitPhoto({ questId, photoUrl, comment, isDemo }) {
  const user = await getOrCreateUser();
  const { data, error } = await supabase.rpc('complete_quest_submission', {
    p_user_id: String(user.id),
    p_quest_id: String(questId),
    p_photo_url: photoUrl,
    p_comment: comment || null,
    p_is_demo: Boolean(isDemo),
  });
  if (error) {
    const missingRpc = error.code === 'PGRST202' || /complete_quest_submission/i.test(error.message || '');
    if (missingRpc) {
      throw new Error('任務結算尚未啟用，請先套用最新資料庫 migration');
    }
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ledger_id || !result?.event_id) {
    throw new Error('任務結算未回傳完整結果，請稍後再試');
  }

  return {
    questId: result.quest_id,
    treeId: result.tree_id,
    areaId: result.area_id,
    participationId: result.participation_id,
    ledgerId: result.ledger_id,
    questKind: result.quest_kind,
    points: result.points,
    totalPoints: result.total_points,
    eventId: result.event_id,
  };
}

export async function getUserStats() {
  const user = await getOrCreateUser();
  const { data: participations } = await supabase
    .from('participations')
    .select('*, quests!inner(*)')
    .eq('user_id', user.id)
    .eq('quests.content_version', CURRENT_QUEST_CONTENT_VERSION)
    .order('created_at', { ascending: false });

  return {
    user,
    totalPoints: user.total_points,
    participations: participations || [],
  };
}

export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, total_points')
    .order('total_points', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function toggleFollowTree(treeId) {
  const user = await getOrCreateUser();
  const { data: existing } = await supabase
    .from('tree_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('tree_id', treeId)
    .maybeSingle();

  if (existing) {
    await supabase.from('tree_follows').delete().eq('id', existing.id);
    return false;
  }

  await supabase.from('tree_follows').insert({ user_id: user.id, tree_id: treeId });
  await supabase.from('community_events').insert({
    user_id: user.id,
    event_type: 'tree_followed',
    tree_id: treeId,
  });
  return true;
}

export async function getFollowedTrees() {
  const user = await getOrCreateUser();
  const { data } = await supabase
    .from('tree_follows')
    .select('tree_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function isTreeFollowed(treeId) {
  const user = await getOrCreateUser();
  const { data } = await supabase
    .from('tree_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('tree_id', treeId)
    .maybeSingle();
  return !!data;
}

export async function submitPlantingProposal({
  lat,
  lng,
  reason,
  photoUrl,
  areaId,
  locationSource = 'game-player',
  evidenceKind = 'planting-site',
  clientRequestId,
}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('目前無法取得提案位置，請回到地圖後再試');
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('提案位置格式不正確');
  }

  const user = await getOrCreateUser();
  const { data, error } = await supabase
    .from('planting_proposals')
    .upsert({
      user_id: user.id,
      lat,
      lng,
      reason,
      photo_url: photoUrl,
      area_id: areaId,
      location_source: locationSource,
      evidence_kind: evidenceKind,
      client_request_id: clientRequestId,
    }, {
      onConflict: 'user_id,client_request_id',
      ignoreDuplicates: true,
    })
    .select()
    .maybeSingle();
  if (error) throw error;

  let proposal = data;
  if (!proposal && clientRequestId) {
    const { data: existing, error: existingError } = await supabase
      .from('planting_proposals')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_request_id', clientRequestId)
      .single();
    if (existingError) throw existingError;
    proposal = existing;
  }
  if (!proposal) throw new Error('提案未能保存，請再試一次');

  const { error: eventError } = await supabase.from('community_events').insert({
    event_id: `proposal.saved:${proposal.id}`,
    user_id: user.id,
    event_type: 'proposal_created',
    area_id: areaId,
    metadata: { proposal_id: proposal.id, lat, lng, location_source: locationSource },
  });
  if (eventError && eventError.code !== '23505') throw eventError;
  return proposal;
}

export async function getCommunityFeed(areaId, limit = 30) {
  let query = supabase
    .from('community_events')
    .select('*, users(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (areaId) query = query.eq('area_id', areaId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function generateQuestsForArea(areaId, treesOrIds) {
  const existingQuests = await getActiveQuests(areaId);
  const existingTreeIds = new Set(existingQuests.map(q => q.tree_id));

  const NOTABLE_SPECIES = new Set(['榕樹', '茄苳', '樟樹', '楓香', '菩提樹', '山櫻花', '木棉', '大王椰子', '阿勃勒']);
  const MIN_DIAMETER = 40;

  const trees = treesOrIds.map(t => typeof t === 'string' ? { treeId: t } : t);
  const notable = trees.filter(t =>
    !existingTreeIds.has(t.treeId) &&
    ((t.diameter && t.diameter >= MIN_DIAMETER) || NOTABLE_SPECIES.has(t.species))
  );
  const newQuests = notable
    .slice(0, 15)
    .map(t => {
      const npcName = generateNpcName(t.species, t.region);
      const dialogue = generateDialogue('general');
      return {
        tree_id: t.treeId,
        quest_type: 'general',
        title: '近期全樹照',
        description: dialogue,
        npc_name: npcName,
        npc_dialogue: dialogue,
        points: GENERAL_POINTS,
        area_id: areaId,
        content_version: CURRENT_QUEST_CONTENT_VERSION,
        is_active: true,
        satisfied: false,
        evidence_kind: 'whole_tree',
      };
    });

  if (newQuests.length === 0) return [];
  const { data, error } = await supabase
    .from('quests')
    .insert(newQuests)
    .select();
  if (error) throw error;
  return data || [];
}

// --- Relay (社區接力) ---

export async function getRelayChains(areaId, limit = 30) {
  let query = supabase
    .from('relay_chains')
    .select('*, users!relay_chains_started_by_fkey(display_name), holder:users!relay_chains_current_holder_fkey(display_name)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (areaId) query = query.eq('area_id', areaId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRelayLegs(chainId) {
  const { data, error } = await supabase
    .from('relay_legs')
    .select('*, users(display_name)')
    .eq('chain_id', chainId)
    .order('leg_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function startRelay(questId, treeId, areaId) {
  const user = await getOrCreateUser();
  const { data: chain, error } = await supabase
    .from('relay_chains')
    .insert({ quest_id: questId, tree_id: treeId, area_id: areaId, started_by: user.id, current_holder: user.id })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('relay_legs').insert({
    chain_id: chain.id, user_id: user.id, leg_order: 1, status: 'pending',
  });

  await supabase.from('community_events').insert({
    user_id: user.id, event_type: 'relay_started', tree_id: treeId, area_id: areaId,
    metadata: { chain_id: chain.id },
  });
  return chain;
}

export async function pickUpRelay(chainId) {
  const user = await getOrCreateUser();
  const { data: chain } = await supabase
    .from('relay_chains')
    .select('*')
    .eq('id', chainId)
    .single();
  if (!chain || chain.status !== 'active') throw new Error('接力已結束');
  if (chain.current_holder === user.id) throw new Error('你已經在接棒中');

  const newOrder = chain.relay_count + 1;
  await supabase.from('relay_legs').insert({
    chain_id: chainId, user_id: user.id, leg_order: newOrder, status: 'pending',
  });

  await supabase
    .from('relay_chains')
    .update({ current_holder: user.id, relay_count: newOrder, updated_at: new Date().toISOString() })
    .eq('id', chainId);

  await supabase.from('community_events').insert({
    user_id: user.id, event_type: 'relay_picked_up', tree_id: chain.tree_id, area_id: chain.area_id,
    metadata: { chain_id: chainId, leg_order: newOrder },
  });
  return { chainId, legOrder: newOrder };
}

export async function submitRelayLeg(chainId, photoUrl, comment) {
  const user = await getOrCreateUser();
  const { data: leg } = await supabase
    .from('relay_legs')
    .select('*')
    .eq('chain_id', chainId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (!leg) throw new Error('沒有待完成的接力');

  await supabase
    .from('relay_legs')
    .update({ photo_url: photoUrl, comment, status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', leg.id);

  const points = 15;
  await supabase.from('ledger').insert({
    user_id: user.id, quest_id: null, points, reason: 'relay_submitted',
  });
  await supabase.from('users').update({ total_points: user.total_points + points }).eq('id', user.id);

  return { points };
}

export async function resetUserData() {
  const user = await getOrCreateUser();
  await supabase.from('ledger').delete().eq('user_id', user.id);
  await supabase.from('participations').delete().eq('user_id', user.id);
  await supabase.from('tree_follows').delete().eq('user_id', user.id);
  await supabase.from('community_events').delete().eq('user_id', user.id);
  await supabase.from('users').update({ total_points: 0 }).eq('id', user.id);
}
