import { useState, useEffect, useMemo, useRef } from 'react';

export function useOptimisticSet<K>(serverSet: ReadonlySet<K>) {
  const [pending, setPending] = useState({ adds: new Set<K>(), removes: new Set<K>() });
  const serverRef = useRef(serverSet);
  serverRef.current = serverSet;

  useEffect(() => {
    setPending(prev => {
      if (prev.adds.size === 0 && prev.removes.size === 0) return prev;
      const adds = new Set<K>();
      const removes = new Set<K>();
      let changed = false;
      for (const key of prev.adds) {
        if (serverSet.has(key)) changed = true;
        else adds.add(key);
      }
      for (const key of prev.removes) {
        if (!serverSet.has(key)) changed = true;
        else removes.add(key);
      }
      return changed ? { adds, removes } : prev;
    });
  }, [serverSet]);

  function has(key: K): boolean {
    if (pending.removes.has(key)) return false;
    if (pending.adds.has(key)) return true;
    return serverSet.has(key);
  }

  function toggle(key: K) {
    setPending(prev => {
      const server = serverRef.current;
      const adds = new Set(prev.adds);
      const removes = new Set(prev.removes);
      const isPresent = !removes.has(key) && (adds.has(key) || server.has(key));
      if (isPresent) {
        adds.delete(key);
        if (server.has(key)) removes.add(key);
      } else {
        removes.delete(key);
        if (!server.has(key)) adds.add(key);
      }
      return { adds, removes };
    });
  }

  const effectiveSet = useMemo(() => {
    if (pending.adds.size === 0 && pending.removes.size === 0) return serverSet;
    const result = new Set(serverSet);
    for (const key of pending.removes) result.delete(key);
    for (const key of pending.adds) result.add(key);
    return result as ReadonlySet<K>;
  }, [serverSet, pending]);

  return { has, toggle, effectiveSet };
}

export function useOptimisticInserts<TPending, TServer>(
  serverItems: readonly TServer[],
  matchFn: (pending: TPending, server: TServer) => boolean,
) {
  const [items, setItems] = useState<TPending[]>([]);
  const matchRef = useRef(matchFn);
  matchRef.current = matchFn;

  useEffect(() => {
    setItems(prev => {
      if (prev.length === 0) return prev;
      const matched = new Set<number>();
      const next = prev.filter(opt => {
        const idx = serverItems.findIndex((s, i) => !matched.has(i) && matchRef.current(opt, s));
        if (idx !== -1) { matched.add(idx); return false; }
        return true;
      });
      return next.length < prev.length ? next : prev;
    });
  }, [serverItems]);

  const pending = useMemo(() => {
    if (items.length === 0) return items;
    const matched = new Set<number>();
    return items.filter(opt => {
      const idx = serverItems.findIndex((s, i) => !matched.has(i) && matchRef.current(opt, s));
      if (idx !== -1) { matched.add(idx); return false; }
      return true;
    });
  }, [items, serverItems]);

  function add(item: TPending) {
    setItems(prev => [...prev, item]);
  }

  function addMany(newItems: TPending[]) {
    setItems(prev => [...prev, ...newItems]);
  }

  return { pending, add, addMany };
}

export function useOptimisticDeletions<K>(serverKeys: ReadonlySet<K>) {
  const [deleted, setDeleted] = useState<Set<K>>(() => new Set());

  useEffect(() => {
    setDeleted(prev => {
      if (prev.size === 0) return prev;
      const next = new Set<K>();
      let changed = false;
      for (const key of prev) {
        if (!serverKeys.has(key)) changed = true;
        else next.add(key);
      }
      return changed ? next : prev;
    });
  }, [serverKeys]);

  function isDeleted(key: K): boolean {
    return deleted.has(key);
  }

  function markDeleted(key: K) {
    setDeleted(prev => new Set(prev).add(key));
  }

  return { isDeleted, markDeleted };
}

// V must be comparable with === (primitives only)
export function useOptimisticOverrides<K, V>(serverValueMap: ReadonlyMap<K, V>) {
  const [overrides, setOverrides] = useState<Map<K, V>>(() => new Map());

  useEffect(() => {
    setOverrides(prev => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Map<K, V>();
      for (const [key, value] of prev) {
        if (serverValueMap.get(key) === value) changed = true;
        else next.set(key, value);
      }
      return changed ? next : prev;
    });
  }, [serverValueMap]);

  function get(key: K): V | undefined {
    return overrides.get(key);
  }

  function set(key: K, value: V) {
    setOverrides(prev => new Map(prev).set(key, value));
  }

  return { get, set };
}
