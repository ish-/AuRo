function makeRepository (namespace, storage) {
  const toKey = (id) => `${namespace}${ id }`;

  return {
    async getTarget (id) {
      const key = toKey(id)
      const results = await storage.get(key);
      return results[key] || null;
    },
    setTarget (id, deviceId) {
      return storage.set({ [toKey(id)]: deviceId });
    },
    removeTarget (id) {
      return storage.remove([toKey(id)]);
    },
  };
}

export const tabs = makeRepository('tab_', chrome.storage.session);
export const hosts = makeRepository('host_', chrome.storage.local);
