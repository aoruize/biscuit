import { useState, useEffect, useRef, forwardRef } from 'react';
import clsx from 'clsx';
import {
  IconMessageCirclePlus,
  IconMoodSmile,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import type { Message, User, Thread, Reaction } from '../module_bindings/types';
import { openEmojiPicker } from './emojiPicker/store';
import { Tooltip } from './Tooltip';

interface ReactionGroup {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface MessageBubbleProps {
  message: Message;
  user: User | undefined;
  getUserDisplayName: (user: User) => string;
  thread: Thread | undefined;
  isOwn: boolean;
  showHeader: boolean;
  reactions: readonly Reaction[];
  myIdentityHex: string | null;
  threadAnnotation?: React.ReactNode;
  compact?: boolean;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onCreateThread: () => void;
  onOpenThread: (threadId: bigint) => void;
  onToggleReaction: (emoji: string) => void;
}

export function MessageBubble(props: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(props.message.text);
  const [showActions, setShowActions] = useState(false);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const callbacksRef = useRef(props);
  callbacksRef.current = props;

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        editContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [isEditing]);

  useEffect(() => {
    function handleAction(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail.messageId !== callbacksRef.current.message.id.toString()) return;
      if (detail.action === 'edit') {
        setIsEditing(true);
        setEditText(callbacksRef.current.message.text);
      } else if (detail.action === 'delete') {
        callbacksRef.current.onDelete();
      } else if (detail.action === 'reply') {
        const p = callbacksRef.current;
        if (p.thread) {
          p.onOpenThread(p.thread.id);
        } else {
          p.onCreateThread();
        }
      } else if (detail.action === 'react') {
        callbacksRef.current.onToggleReaction(detail.emoji);
      }
    }
    document.addEventListener('context-menu-action', handleAction);
    return () => document.removeEventListener('context-menu-action', handleAction);
  }, []);

  const displayName = props.user ? props.getUserDisplayName(props.user) : 'Unknown';
  const avatarColor = props.user?.avatarColor ?? '#5865f2';
  const sentDate = props.message.sent.toDate();

  const reactionGroups = groupReactions(props.reactions, props.myIdentityHex);

  function handleEditSubmit(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editText.trim() && editText.trim() !== props.message.text) {
        props.onEdit(editText.trim());
      }
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(props.message.text);
    }
  }

  function handleEmojiButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    openEmojiPicker(props.message.id.toString(), { x: rect.left, y: rect.bottom + 4 });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatFullDate(date: Date): string {
    const now = new Date();
    const isToday =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();
    if (isToday) return `Today at ${formatTime(date)}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate();
    if (isYesterday) return `Yesterday at ${formatTime(date)}`;
    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + formatTime(date);
  }

  function formatShortDate(date: Date): string {
    const now = new Date();
    const isToday =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();
    if (isToday) return formatTime(date);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const contextPayload = JSON.stringify({
    messageId: props.message.id.toString(),
    hasThread: Boolean(props.thread),
    isOwn: props.isOwn,
  });

  return (
    <div
      className={clsx(
        'group relative flex rounded-xl px-2 py-1.5',
        'transition-colors hover:bg-discord-hover/25',
        props.compact ? 'gap-2.5' : 'gap-4',
        props.showHeader ? 'mt-4' : 'mt-0'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-context-menu-target="message"
      data-context-menu-payload={contextPayload}
    >
      {props.showHeader ? (
        <div
          className={clsx(
            'mt-0.5 flex shrink-0 select-none items-center justify-center rounded-xl font-semibold text-discord-darker',
            props.compact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
          )}
          style={{ backgroundColor: avatarColor }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className={clsx('flex shrink-0 items-start justify-center', props.compact ? 'w-8' : 'w-10')}>
          <span className="invisible pt-1 text-[10px] text-discord-muted group-hover:visible">
            {sentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {props.showHeader && (
          <div className="flex select-none items-baseline gap-2">
            <span className="cursor-pointer font-semibold text-discord-text hover:underline">
              {displayName}
            </span>
            <span className="text-xs text-discord-muted">{formatFullDate(sentDate)}</span>
          </div>
        )}

        {props.threadAnnotation}

        {isEditing ? (
          <div ref={editContainerRef} className="mt-1 rounded-xl border border-discord-active/70 bg-discord-input p-2.5">
            <textarea
              autoFocus
              className="w-full resize-none border-none bg-transparent text-discord-text outline-none"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditSubmit}
              rows={Math.min(editText.split('\n').length, 8)}
            />
            <div className="mt-1 select-none text-xs text-discord-muted">
              escape to <button className="cursor-pointer text-discord-link hover:underline" onClick={() => { setIsEditing(false); setEditText(props.message.text); }}>cancel</button>
              {' '}&bull; enter to <button className="cursor-pointer text-discord-link hover:underline" onClick={() => { props.onEdit(editText.trim()); setIsEditing(false); }}>save</button>
            </div>
          </div>
        ) : (
          <div className="text-[15px] leading-[1.5rem] text-discord-text">
            <span className="whitespace-pre-wrap break-words">{props.message.text}</span>
            {props.message.edited && (
              <span className="ml-1 select-none text-[10px] text-discord-muted">(edited)</span>
            )}
          </div>
        )}

        {reactionGroups.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {reactionGroups.map(rg => (
              <button
                key={rg.emoji}
                onClick={() => props.onToggleReaction(rg.emoji)}
                className={clsx(
                  'flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                  rg.reacted
                    ? 'border-discord-brand/50 bg-discord-brand/15 text-discord-brand'
                    : 'border-discord-active/70 bg-discord-hover/30 text-discord-muted hover:border-discord-active'
                )}
              >
                <span className="text-sm">{rg.emoji}</span>
                <span className="font-medium">{rg.count}</span>
              </button>
            ))}
            <Tooltip content="Add reaction...">
              <button
                onClick={handleEmojiButtonClick}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-discord-active/70 bg-discord-hover/30 text-discord-muted transition-colors hover:border-discord-active hover:text-discord-text"
              >
                <IconMoodSmile size={14} stroke={2} />
              </button>
            </Tooltip>
          </div>
        )}

        {props.thread && props.thread.replyCount > 0n && (
          <button
            onClick={() => props.onOpenThread(props.thread!.id)}
            className="group/thread mt-2 flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-1 py-1 text-[13px] transition-colors hover:bg-discord-hover/40"
          >
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-semibold text-discord-darker"
              style={{ backgroundColor: avatarColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-discord-link">
              {props.thread.replyCount.toString()} {props.thread.replyCount === 1n ? 'reply' : 'replies'}
            </span>
            <span className="text-[11px] text-discord-muted group-hover/thread:hidden">
              {formatShortDate(props.thread.lastActivity.toDate())}
            </span>
            <span className="hidden text-[11px] font-medium text-discord-muted group-hover/thread:inline">
              View thread &rsaquo;
            </span>
          </button>
        )}
      </div>

      {showActions && !isEditing && (
        <div className="absolute -top-4 right-2 flex rounded-xl border border-discord-active/80 bg-discord-sidebar p-0.5 shadow-xl shadow-black/30">
          <Tooltip content="Add reaction...">
            <ActionButton
              onClick={handleEmojiButtonClick}
              icon={<IconMoodSmile size={17} stroke={2.1} />}
            />
          </Tooltip>
          <Tooltip content="Reply">
            <ActionButton
              onClick={() => {
                if (props.thread) {
                  props.onOpenThread(props.thread.id);
                } else {
                  props.onCreateThread();
                }
              }}
              icon={<IconMessageCirclePlus size={17} stroke={2.1} />}
            />
          </Tooltip>
          {props.isOwn && (
            <>
              <Tooltip content="Edit">
                <ActionButton
                  onClick={() => { setIsEditing(true); setEditText(props.message.text); }}
                  icon={<IconPencil size={17} stroke={2.1} />}
                />
              </Tooltip>
              <Tooltip content="Delete">
                <ActionButton
                  onClick={props.onDelete}
                  danger
                  icon={<IconTrash size={17} stroke={2.1} />}
                />
              </Tooltip>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const ActionButton = forwardRef<HTMLButtonElement, {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  icon: React.ReactNode;
  danger?: boolean;
}>(function ActionButton(props, ref) {
  return (
    <button
      ref={ref}
      onClick={props.onClick}
      className={clsx(
        'cursor-pointer select-none rounded-lg p-1.5 transition-colors',
        props.danger
          ? 'text-discord-muted hover:text-discord-red'
          : 'text-discord-muted hover:text-discord-brand'
      )}
    >
      {props.icon}
    </button>
  );
});

function groupReactions(reactions: readonly Reaction[], myIdentityHex: string | null): ReactionGroup[] {
  const map = new Map<string, { count: number; reacted: boolean }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    const isMe = myIdentityHex !== null && r.reactor.toHexString() === myIdentityHex;
    if (existing) {
      existing.count++;
      if (isMe) existing.reacted = true;
    } else {
      map.set(r.emoji, { count: 1, reacted: isMe });
    }
  }
  return [...map.entries()].map(([emoji, data]) => ({ emoji, ...data }));
}
