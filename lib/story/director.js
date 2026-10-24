import { createStoryProgressStore } from './state.js';

function matchesFilters(filters, payload) {
  return Object.entries(filters || {}).every(([key, expected]) => payload?.[key] === expected);
}

function dedupeKey(binding, event) {
  const scope = binding.dedupeScope;
  if (scope === 'every_successful_submit' || scope === 'per_committed_ledger_event') {
    return event.id ? `${binding.sceneId}:event:${event.id}` : null;
  }
  if (scope === 'once_per_area') {
    return event.areaId ? `${binding.sceneId}:area:${event.areaId}` : null;
  }
  if (scope === 'once_per_tree') {
    return event.treeId ? `${binding.sceneId}:tree:${event.treeId}` : null;
  }
  return `${binding.sceneId}:once`;
}

function isRepeatable(binding) {
  return binding.dedupeScope === 'every_interaction';
}

export function createStoryDirector({ catalog, bindings, runtimeProfile, storage }) {
  const progress = createStoryProgressStore(storage);
  const enabled = catalog.enabledScenes;
  const capabilities = runtimeProfile.capabilities || {};
  const bindingOverrides = runtimeProfile.bindingOverrides || {};

  const safeBindings = (bindings.bindings || [])
    .filter(binding => enabled.has(binding.sceneId))
    .map(binding => ({ ...binding, ...(bindingOverrides[binding.sceneId] || {}) }));

  function resolveEvent(eventName, payload) {
    const binding = safeBindings.find(item => item.event === eventName && matchesFilters(item.filters, payload));
    if (!binding) return null;

    const sourceScene = catalog.sceneById.get(binding.sceneId);
    const requirementsMet = (sourceScene?.requiresCapabilities || []).every(name => capabilities[name] === true);
    if (!requirementsMet) return null;

    const repeatable = isRepeatable(binding);
    const key = repeatable ? null : dedupeKey(binding, {
      ...payload,
      id: payload.eventId || payload.id,
    });
    return repeatable || key ? { binding, key, repeatable } : null;
  }

  return {
    emit(eventName, payload = {}) {
      const resolved = resolveEvent(eventName, payload);
      if (!resolved || (!resolved.repeatable && !progress.consume(resolved.key))) return null;
      return catalog.normalize(resolved.binding.sceneId, payload);
    },
    canEmit(eventName, payload = {}) {
      const resolved = resolveEvent(eventName, payload);
      return !!resolved && (resolved.repeatable || !progress.has(resolved.key));
    },
    reset: progress.reset,
  };
}
