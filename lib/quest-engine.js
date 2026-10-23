import { supabase } from './supabase';
import { getDeviceId } from './device-id';
import { generateNpcName, generateDialogue } from './npc-names';

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
    .eq('is_active', true)
    .eq('satisfied', false);
  if (error) throw error;
  return data || [];
}

export async function acceptQuest(questId) {
  const user = await getOrCreateUser();
  const { data: existing } = await supabase
    .from('participations')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('participations')
    .insert({ quest_id: questId, user_id: user.id, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitPhoto({ questId, photoUrl, comment, isDemo }) {
  const user = await getOrCreateUser();

  const { data: participation } = await supabase
    .from('participations')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!participation) throw new Error('尚未領取此任務');

  const { error: updateError } = await supabase
    .from('participations')
    .update({
      photo_url: photoUrl,
      status: 'submitted',
      comment,
      is_demo: isDemo || false,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', participation.id);
  if (updateError) throw updateError;

  const { data: quest } = await supabase
    .from('quests')
    .select('points, quest_type')
    .eq('id', questId)
    .single();

  const points = quest?.points || GENERAL_POINTS;
  await supabase.from('ledger').insert({
    user_id: user.id,
    quest_id: questId,
    participation_id: participation.id,
    points,
    reason: isDemo ? 'demo_submit' : 'photo_submitted',
  });

  await supabase
    .from('users')
    .update({ total_points: user.total_points + points })
    .eq('id', user.id);

  await supabase.from('community_events').insert({
    user_id: user.id,
    event_type: 'photo_submitted',
    tree_id: quest?.tree_id,
    quest_id: questId,
    area_id: quest?.area_id,
  });

  return { points, totalPoints: user.total_points + points };
}

export async function getUserStats() {
  const user = await getOrCreateUser();
  const { data: participations } = await supabase
    .from('participations')
    .select('*, quests(*)')
    .eq('user_id', user.id)
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

export async function submitPlantingProposal({ lat, lng, reason, photoUrl, areaId }) {
  const user = await getOrCreateUser();
  const { data, error } = await supabase
    .from('planting_proposals')
    .insert({ user_id: user.id, lat, lng, reason, photo_url: photoUrl, area_id: areaId })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('community_events').insert({
    user_id: user.id,
    event_type: 'proposal_created',
    area_id: areaId,
    metadata: { lat, lng },
  });
  return data;
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

  const trees = treesOrIds.map(t => typeof t === 'string' ? { treeId: t } : t);
  const newQuests = trees
    .filter(t => !existingTreeIds.has(t.treeId))
    .slice(0, 50)
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
