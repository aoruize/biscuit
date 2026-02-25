import { useEffect, useLayoutEffect, useRef } from 'react';
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
import clsx from 'clsx';
import {
  IconMessageCirclePlus,
  IconMoodSmile,
  IconPencil,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '@tabler/icons-react';
import {
  useContextMenuStore,
  openContextMenu,
  closeContextMenu,
} from './store';
import { openEmojiPicker } from '../emojiPicker/store';

function dispatchAction(action: string, id: string) {
  document.dispatchEvent(
    new CustomEvent('context-menu-action', {
      detail: { action, messageId: id, channelId: id },
    }),
  );
  closeContextMenu();
}

function GlobalContextMenu() {
  const { isOpen, position, target } = useContextMenuStore();

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
      if (!open) closeContextMenu();
    },
    middleware: [offset(5), flip({ padding: 8 }), shift({ padding: 8 })],
    placement: 'right-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useLayoutEffect(() => {
    if (isOpen && position) {
      refs.setPositionReference(virtualElRef.current);
      update();
    }
  }, [isOpen, position, refs, update]);

  if (!isOpen || !target) return null;

  let content: React.ReactNode = null;

  if (target.type === 'message') {
    const isOwn = Boolean(target.data.isOwn);
    const messageId = String(target.data.messageId);

    content = (
      <>
        <ContextMenuItem
          label="Add Reaction"
          icon={<IconMoodSmile size={16} stroke={2} />}
          shortcut="R"
          onClick={() => {
            const pos = position ?? { x: 0, y: 0 };
            closeContextMenu();
            openEmojiPicker(messageId, pos);
          }}
        />
        <ContextMenuItem
          label="Reply in Thread"
          icon={<IconMessageCirclePlus size={16} stroke={2} />}
          shortcut="T"
          onClick={() => dispatchAction('reply', messageId)}
        />
        {isOwn && (
          <>
            <ContextMenuItem
              label="Edit Message"
              icon={<IconPencil size={16} stroke={2} />}
              shortcut="E"
              onClick={() => dispatchAction('edit', messageId)}
            />
            <ContextMenuItem
              label="Delete Message"
              icon={<IconTrash size={16} stroke={2} />}
              shortcut="⌫"
              onClick={() => dispatchAction('delete', messageId)}
              danger
            />
          </>
        )}
      </>
    );
  } else if (target.type === 'channel') {
    const channelId = String(target.data.channelId);
    const isStarred = Boolean(target.data.isStarred);

    content = (
      <>
        <ContextMenuItem
          label={isStarred ? 'Remove from Starred' : 'Move to Starred'}
          icon={isStarred
            ? <IconStarFilled size={16} stroke={2} className="text-discord-yellow" />
            : <IconStar size={16} stroke={2} />
          }
          onClick={() => dispatchAction('toggle-star', channelId)}
        />
        <ContextMenuItem
          label="Delete Channel"
          icon={<IconTrash size={16} stroke={2} />}
          onClick={() => dispatchAction('delete-channel', channelId)}
          danger
        />
      </>
    );
  } else {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-[9999]"
      >
        <div className="min-w-[180px] select-none rounded-xl border border-discord-active/80 bg-discord-sidebar p-1 shadow-xl shadow-black/40">
          {content}
        </div>
      </div>
    </FloatingPortal>
  );
}

function ContextMenuItem(props: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      onClick={props.onClick}
      className={clsx(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
        props.danger
          ? 'text-discord-red hover:bg-discord-red/15'
          : 'text-discord-text hover:bg-discord-brand/15 hover:text-discord-brand',
      )}
    >
      {props.icon}
      <span className="flex-1">{props.label}</span>
      {props.shortcut && (
        <kbd className="rounded bg-discord-active/60 px-1.5 py-0.5 font-mono text-[10px] text-discord-muted">
          {props.shortcut}
        </kbd>
      )}
    </button>
  );
}

export function GlobalContextMenuProvider(props: { children: React.ReactNode }) {
  useEffect(() => {
    function handleContextMenu(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(
        '[data-context-menu-target]',
      ) as HTMLElement | null;
      if (!target) return;

      const targetType = target.dataset.contextMenuTarget;
      if (!targetType) return;

      const rawPayload = target.dataset.contextMenuPayload;
      if (!rawPayload) return;

      e.preventDefault();

      const payload = JSON.parse(rawPayload) as Record<string, unknown>;
      openContextMenu({ type: targetType, data: payload }, { x: e.clientX, y: e.clientY });
    }

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <>
      <GlobalContextMenu />
      {props.children}
    </>
  );
}
