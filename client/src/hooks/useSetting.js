import { useEffect, useState } from 'react';
import api from '../utils/api';

// Settings rarely change within a session; share one request per key across components.
const cache = new Map();

export const invalidateSetting = (key) => cache.delete(key);

/** Reads a public settings key (e.g. "general", "emergency"). Returns undefined while loading. */
const useSetting = (key) => {
  const [value, setValue] = useState(() => cache.get(key)?.value);

  useEffect(() => {
    let active = true;
    let entry = cache.get(key);
    if (!entry) {
      entry = { promise: api.get(`/settings/${key}`).then(({ data }) => data.data) };
      cache.set(key, entry);
    }
    entry.promise
      .then((v) => {
        entry.value = v;
        if (active) setValue(v);
      })
      .catch(() => {
        cache.delete(key);
        if (active) setValue(null);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return [value, setValue];
};

export default useSetting;
