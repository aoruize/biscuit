import { useState } from 'react';
import clsx from 'clsx';
import {
  IconMessageCirclePlus,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import type { Message, User, Thread } from '../module_bindings/types';

interface MessageBubbleProps {
  message: Message;
  user: User | undefined;
  getUserDisplayName: (user: User) => string;
  thread: Thread | undefined;
  isOwn: boolean;
  showHeader: boolean;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onCreateThread: () => void;
  onOpenThread: (threadId: bigint) => void;
}

export function MessageBubble(props: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(props.message.text);
  const [showActions, setShowActions] = useState(false);

  const displayName = props.user ? props.getUserDisplayName(props.user) : 'Unknown';
  const avatarColor = props.user?.avatarColor ?? '#5865f2';
  const sentDate = props.message.sent.toDate();

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

  const threadCreatorUser = props.thread
    ? props.user
    : undefined;

  return (
    <div
      className={clsx(
        'group relative flex gap-4 rounded-xl px-2 py-1.5',
        'transition-colors hover:bg-discord-hover/25',
        props.showHeader ? 'mt-4' : 'mt-0'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {props.showHeader ? (
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl text-sm font-semibold text-discord-darker"
          style={{ backgroundColor: avatarColor }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="flex w-10 shrink-0 items-start justify-center">
          <span className="invisible pt-1 text-[10px] text-discord-muted group-hover:visible">
            {formatTime(sentDate)}
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

        {isEditing ? (
          <div className="mt-1 rounded-xl border border-discord-active/70 bg-discord-input p-2.5">
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

        {props.thread && (
          <button
            onClick={() => props.onOpenThread(props.thread!.id)}
            className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[13px] transition-colors hover:bg-discord-hover/40"
          >
            <div
              className="flex h-5 w-5 shrink-0 select-none items-center justify-center rounded text-[9px] font-semibold text-discord-darker"
              style={{ backgroundColor: avatarColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="select-none font-medium text-discord-link">
              {props.thread.replyCount.toString()} {props.thread.replyCount === 1n ? 'reply' : 'replies'}
            </span>
            <span className="select-none text-[11px] text-discord-muted">
              {formatShortDate(props.thread.lastActivity.toDate())}
            </span>
          </button>
        )}
      </div>

      {showActions && !isEditing && (
        <div className="absolute -top-4 right-2 flex rounded-xl border border-discord-active/80 bg-discord-sidebar p-0.5 shadow-xl shadow-black/30">
          {!props.thread && (
            <ActionButton
              title="Reply"
              onClick={props.onCreateThread}
              icon={<IconMessageCirclePlus size={17} stroke={2.1} />}
            />
          )}
          {props.isOwn && (
            <>
              <ActionButton
                title="Edit"
                onClick={() => { setIsEditing(true); setEditText(props.message.text); }}
                icon={<IconPencil size={17} stroke={2.1} />}
              />
              <ActionButton
                title="Delete"
                onClick={props.onDelete}
                danger
                icon={<IconTrash size={17} stroke={2.1} />}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton(props: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      title={props.title}
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
}
