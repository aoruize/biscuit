import { useSyncExternalStore } from 'react';

interface EmojiPickerState {
  isOpen: boolean;
  messageId: string | null;
  position: { x: number; y: number } | null;
}

const CLOSED: EmojiPickerState = { isOpen: false, messageId: null, position: null };
let state: EmojiPickerState = CLOSED;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function openEmojiPicker(messageId: string, position: { x: number; y: number }) {
  state = { isOpen: true, messageId, position };
  emit();
}

export function closeEmojiPicker() {
  if (!state.isOpen) return;
  state = CLOSED;
  emit();
}

export function useEmojiPickerStore(): EmojiPickerState {
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
