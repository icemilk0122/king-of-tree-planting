import { supabase } from './supabase';
import { getDeviceId } from './device-id';

const GENERAL_POINTS = 10;
const SPECIAL_POINTS = 20;
const FRESHNESS_DAYS = 60;

export async function getOrCreateUser() {
  const deviceId = getDeviceId();
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('users')
    .insert({ device_id: deviceId, display_name: `探索者${deviceId.slice(-4)}` })
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
    .single();
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

  const { data: participation, error: pError } = await supabase
    .from('participations')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', user.id)
    .single();
  if (pError || !participation) throw new Error('尚未領取此任務');

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
    .single();

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
    .single();
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

export async function generateQuestsForArea(areaId, treeIds) {
  const existingQuests = await getActiveQuests(areaId);
  const existingTreeIds = new Set(existingQuests.map(q => q.tree_id));

  const newQuests = treeIds
    .filter(id => !existingTreeIds.has(id))
    .slice(0, 50)
    .map(treeId => ({
      tree_id: treeId,
      quest_type: 'general',
      title: '近期全樹照',
      description: '幫我留張全樹照吧。',
      points: GENERAL_POINTS,
      area_id: areaId,
      is_active: true,
      satisfied: false,
      evidence_kind: 'whole_tree',
    }));

  if (newQuests.length === 0) return [];
  const { data, error } = await supabase
    .from('quests')
    .insert(newQuests)
    .select();
  if (error) throw error;
  return data || [];
}

export async function resetUserData() {
  const user = await getOrCreateUser();
  await supabase.from('ledger').delete().eq('user_id', user.id);
  await supabase.from('participations').delete().eq('user_id', user.id);
  await supabase.from('tree_follows').delete().eq('user_id', user.id);
  await supabase.from('community_events').delete().eq('user_id', user.id);
  await supabase.from('users').update({ total_points: 0 }).eq('id', user.id);
}
