import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { IconHash, IconMessageCircle2, IconX } from '@tabler/icons-react';
import type { Thread, Message, User, Reaction } from '../module_bindings/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput, type MessageInputHandle } from './MessageInput';

interface ThreadPanelProps {
  thread: Thread;
  channelName: string;
  parentMessage: Message | undefined;
  messages: readonly Message[];
  getUserForMessage: (msg: Message) => User | undefined;
  getUserDisplayName: (user: User) => string;
  getReactionsForMessage: (msgId: bigint) => Reaction[];
  isOwnMessage: (msg: Message) => boolean;
  myIdentityHex: string | null;
  highlightedMessageId: string | null;
  typingUsers: readonly User[];
  onSendReply: (text: string, alsoSendToChannel: boolean) => void;
  onEditMessage: (id: bigint, text: string) => void;
  onDeleteMessage: (id: bigint) => void;
  onToggleReaction: (messageId: bigint, emoji: string) => void;
  onClose: () => void;
  onNavigateToChannelMessage: (messageId: bigint) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function ThreadPanel(props: ThreadPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<MessageInputHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [props.messages.length]);

  useEffect(() => {
    replyInputRef.current?.focus();
  }, [props.thread.id]);

  useEffect(() => {
    if (!props.highlightedMessageId || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(
      `[data-message-id="${props.highlightedMessageId}"]`
    );
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [props.highlightedMessageId]);

  function handleSend(text: string) {
    props.onSendReply(text, alsoSendToChannel);
  }

  return (
    <div className="flex h-full min-w-[280px] flex-1 flex-col border-l border-discord-active/60 bg-discord-chat/95">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-discord-active/50 px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-discord-text">
            <IconMessageCircle2 size={16} className="shrink-0 text-discord-brand" />
            <span className="truncate">Thread</span>
          </div>
          <div className="truncate text-xs text-discord-muted">{props.thread.name}</div>
        </div>
        <button
          onClick={props.onClose}
          className="shrink-0 rounded-xl p-1.5 text-discord-muted transition-colors hover:bg-discord-hover hover:text-discord-text"
        >
          <IconX size={20} stroke={2.2} />
        </button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-4">
        {props.parentMessage && (
          <div className="mb-4 rounded-2xl border border-discord-active/60 bg-discord-sidebar/55 p-2">
            <MessageBubble
              message={props.parentMessage}
              user={props.getUserForMessage(props.parentMessage)}
              getUserDisplayName={props.getUserDisplayName}
              thread={undefined}
              reactions={props.getReactionsForMessage(props.parentMessage.id)}
              isOwn={props.isOwnMessage(props.parentMessage)}
              myIdentityHex={props.myIdentityHex}
              showHeader
              compact
              onEdit={(text) => props.onEditMessage(props.parentMessage!.id, text)}
              onDelete={() => props.onDeleteMessage(props.parentMessage!.id)}
              onCreateThread={() => {}}
              onOpenThread={() => {}}
              onToggleReaction={(emoji) => props.onToggleReaction(props.parentMessage!.id, emoji)}
            />
          </div>
        )}

        {props.thread.replyCount > 0n && (
          <div className="mb-3 text-xs font-semibold text-discord-muted">
            {props.thread.replyCount.toString()} {props.thread.replyCount === 1n ? 'reply' : 'replies'}
          </div>
        )}

        {props.messages.map((msg, idx) => {
          const prev = idx > 0 ? props.messages[idx - 1] : null;
          const showHeader = !prev
            || prev.sender.toHexString() !== msg.sender.toHexString()
            || (msg.sent.toDate().getTime() - prev.sent.toDate().getTime()) > 5 * 60 * 1000;

          const isHighlighted = props.highlightedMessageId === msg.id.toString();
          const isCrossPosted = Boolean((msg as Record<string, unknown>).alsoSentToChannel);

          return (
            <div key={msg.id.toString()} data-message-id={msg.id.toString()}>
              {isCrossPosted && (
                <button
                  onClick={() => props.onNavigateToChannelMessage(msg.id)}
                  className="mb-0.5 mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-discord-muted transition-colors hover:text-discord-text"
                >
                  <IconHash size={12} stroke={2.2} className="text-discord-channel" />
                  <span>Also sent to the channel</span>
                </button>
              )}
              <div
                className={clsx(
                  'rounded-lg transition-colors duration-700',
                  isHighlighted && 'bg-discord-brand/10'
                )}
              >
                <MessageBubble
                  message={msg}
                  user={props.getUserForMessage(msg)}
                  getUserDisplayName={props.getUserDisplayName}
                  thread={undefined}
                  reactions={props.getReactionsForMessage(msg.id)}
                  isOwn={props.isOwnMessage(msg)}
                  myIdentityHex={props.myIdentityHex}
                  showHeader={showHeader}
                  compact
                  onEdit={(text) => props.onEditMessage(msg.id, text)}
                  onDelete={() => props.onDeleteMessage(msg.id)}
                  onCreateThread={() => {}}
                  onOpenThread={() => {}}
                  onToggleReaction={(emoji) => props.onToggleReaction(msg.id, emoji)}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-3 pb-1">
          <MessageInput
            ref={replyInputRef}
            placeholder="Reply to thread..."
            onSend={handleSend}
            onTyping={props.onTyping}
            onStopTyping={props.onStopTyping}
          />
          <label className="mt-1.5 flex cursor-pointer select-none items-center gap-1.5 pl-3 text-xs text-discord-muted">
            <input
              type="checkbox"
              checked={alsoSendToChannel}
              onChange={e => setAlsoSendToChannel(e.target.checked)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-discord-brand"
            />
            <span className="truncate">Also send to <span className="font-medium text-discord-text">#{props.channelName}</span></span>
          </label>
          <TypingIndicator users={props.typingUsers} getUserDisplayName={props.getUserDisplayName} />
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function TypingIndicator(props: { users: readonly User[]; getUserDisplayName: (u: User) => string }) {
  if (props.users.length === 0) return <div className="h-4" />;

  const names = props.users.map(u => props.getUserDisplayName(u));
  const text = names.length === 1
    ? `${names[0]} is typing...`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing...`
    : 'Several people are typing...';

  return (
    <div className="flex h-4 items-center gap-1 text-xs text-discord-muted">
      <span className="font-medium">{text}</span>
    </div>
  );
}
