import { useState, useLayoutEffect, useRef } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { EMOJI_CATEGORIES, EMOJI_ALIASES } from './emojis';
import { useEmojiPickerStore, closeEmojiPicker } from './store';

function dispatchReaction(messageId: string, emoji: string) {
  document.dispatchEvent(
    new CustomEvent('context-menu-action', {
      detail: { action: 'react', messageId, emoji },
    }),
  );
  closeEmojiPicker();
}

export function GlobalEmojiPicker() {
  const { isOpen, messageId, position } = useEmojiPickerStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const positionRef = useRef(position);
  positionRef.current = position;

  const virtualElRef = useRef({
    getBoundingClientRect: () => {
      const p = positionRef.current;
      return {
        x: p?.x ?? 0,
        y: p?.y ?? 0,
        top: p?.y ?? 0,
        left: p?.x ?? 0,
        bottom: p?.y ?? 0,
        right: p?.x ?? 0,
        width: 0,
        height: 0,
      };
    },
  });

  const { refs, floatingStyles, context, update } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) {
        closeEmojiPicker();
        setSearch('');
      }
    },
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useLayoutEffect(() => {
    if (isOpen && position) {
      refs.setPositionReference(virtualElRef.current);
      update();
      setSearch('');
      setActiveCategory(0);
    }
  }, [isOpen, position, refs, update]);

  if (!isOpen || !messageId) return null;

  const query = search.toLowerCase();
  const filteredCategories = query
    ? EMOJI_CATEGORIES.map(cat => ({
        ...cat,
        emojis: cat.emojis.filter(e => {
          const aliases = EMOJI_ALIASES[e.emoji];
          return aliases?.some(kw => kw.includes(query)) ?? false;
        }),
      })).filter(cat => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  function handleCategoryClick(idx: number) {
    setActiveCategory(idx);
    setSearch('');
    const el = scrollRef.current;
    if (!el) return;
    const header = el.querySelector(`[data-category="${idx}"]`);
    header?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-[9999]"
      >
        <div className="flex h-[380px] w-[352px] flex-col rounded-xl border border-discord-active/80 bg-discord-sidebar shadow-xl shadow-black/40">
          <div className="flex gap-0.5 border-b border-discord-active/50 px-2 pt-2 pb-1">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(idx)}
                title={cat.name}
                className={
                  'rounded-lg px-1.5 py-1 text-base transition-colors hover:bg-discord-hover ' +
                  (activeCategory === idx && !search ? 'bg-discord-hover' : '')
                }
              >
                {cat.icon}
              </button>
            ))}
          </div>

          <div className="px-2 pt-2 pb-1">
            <input
              type="text"
              placeholder="Search emoji..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-discord-active/70 bg-discord-input px-2.5 py-1.5 text-sm text-discord-text outline-none placeholder:text-discord-muted focus:border-discord-brand/60"
            />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredCategories.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-discord-muted">
                No emoji found
              </div>
            )}
            {filteredCategories.map((cat, idx) => (
              <div key={cat.name} data-category={EMOJI_CATEGORIES.indexOf(cat)}>
                <div className="sticky top-0 z-10 bg-discord-sidebar py-1.5 text-xs font-semibold text-discord-muted">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {cat.emojis.map((entry) => (
                    <button
                      key={`${cat.name}-${entry.emoji}`}
                      onClick={() => dispatchReaction(messageId, entry.emoji)}
                      title={entry.keywords[0]}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-discord-hover"
                    >
                      {entry.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}
