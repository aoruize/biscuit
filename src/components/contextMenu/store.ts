import { useSyncExternalStore } from 'react';

interface ContextMenuTarget {
  type: string;
  data: Record<string, unknown>;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  target: ContextMenuTarget | null;
}

const CLOSED: ContextMenuState = { isOpen: false, position: null, target: null };
let state: ContextMenuState = CLOSED;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function openContextMenu(
  target: ContextMenuTarget,
  position: { x: number; y: number },
) {
  state = { isOpen: true, position, target };
  emit();
}

export function closeContextMenu() {
  if (!state.isOpen) return;
  state = CLOSED;
  emit();
}

export function useContextMenuStore(): ContextMenuState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
  );
}
