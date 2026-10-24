import { createStoryProgressStore } from './state.js';

function matchesFilters(filters, payload) {
  return Object.entries(filters || {}).every(([key, expected]) => payload?.[key] === expected);
}

function dedupeKey(binding, event) {
  const scope = binding.dedupeScope;
  if (scope === 'every_successful_submit' || scope === 'per_committed_ledger_event') {
    return event.id ? `${binding.sceneId}:event:${event.id}` : null;
  }
  return `${binding.sceneId}:once`;
}

export function createStoryDirector({ catalog, bindings, runtimeProfile, storage }) {
  const progress = createStoryProgressStore(storage);
  const enabled = catalog.enabledScenes;
  const capabilities = runtimeProfile.capabilities || {};
  const bindingOverrides = runtimeProfile.bindingOverrides || {};

  const safeBindings = (bindings.bindings || [])
    .filter(binding => enabled.has(binding.sceneId))
    .map(binding => ({ ...binding, ...(bindingOverrides[binding.sceneId] || {}) }));

  return {
    emit(eventName, payload = {}) {
      const binding = safeBindings.find(item => item.event === eventName && matchesFilters(item.filters, payload));
      if (!binding) return null;

      const sourceScene = catalog.sceneById.get(binding.sceneId);
      const requirementsMet = (sourceScene?.requiresCapabilities || []).every(name => capabilities[name] === true);
      if (!requirementsMet) return null;

      const key = dedupeKey(binding, { id: payload.eventId || payload.id });
      if (!key || !progress.consume(key)) return null;
      return catalog.normalize(binding.sceneId, payload);
    },
    reset: progress.reset,
  };
}
