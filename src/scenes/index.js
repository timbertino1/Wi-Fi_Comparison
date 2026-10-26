// Registry of scene modules by sceneId. Each story adds its scenes here.
const registry = new Map();

export function register(sceneModule) {
  registry.set(sceneModule.id, sceneModule);
}

export function sceneFor(sceneId) {
  return registry.get(sceneId) ?? null;
}
