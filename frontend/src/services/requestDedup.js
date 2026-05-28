// Request deduplication — prevents duplicate concurrent GET requests
const inflight = new Map();

function getKey(config) {
  return `${config.method}:${config.baseURL}${config.url}:${JSON.stringify(config.params || {})}`;
}

export function dedup(adapter) {
  return (config) => {
    if (config.method !== 'get') return adapter(config);

    const key = getKey(config);
    if (inflight.has(key)) return inflight.get(key);

    const promise = adapter(config).finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  };
}
