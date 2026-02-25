import { useEffect, useRef, useCallback } from 'react';
import { IconHash } from '@tabler/icons-react';
import type { Channel, Message, User, Thread } from '../module_bindings/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput, type MessageInputHandle } from './MessageInput';

interface MessageAreaProps {
  channel: Channel | null;
  messages: readonly Message[];
  getUserForMessage: (msg: Message) => User | undefined;
  getUserDisplayName: (user: User) => string;
  getThreadForMessage: (msgId: bigint) => Thread | undefined;
  isOwnMessage: (msg: Message) => boolean;
  typingUsers: readonly User[];
  onSendMessage: (text: string) => void;
  onEditMessage: (id: bigint, text: string) => void;
  onDeleteMessage: (id: bigint) => void;
  onCreateThread: (messageId: bigint) => void;
  onOpenThread: (threadId: bigint) => void;
  onTyping: () => void;
}

export function MessageArea(props: MessageAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MessageInputHandle>(null);
  const prevMsgCountRef = useRef(0);
  const prevChannelRef = useRef<bigint | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    const channelId = props.channel?.id ?? null;
    if (channelId !== prevChannelRef.current) {
      prevChannelRef.current = channelId;
      requestAnimationFrame(() => {
        scrollToBottom();
        inputRef.current?.focus();
      });
    }
  }, [props.channel?.id, scrollToBottom]);

  useEffect(() => {
    const count = props.messages.length;
    if (count > prevMsgCountRef.current) {
      const el = containerRef.current;
      if (el) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom) {
          requestAnimationFrame(scrollToBottom);
        }
      }
    }
    prevMsgCountRef.current = count;
  }, [props.messages.length, scrollToBottom]);

  if (!props.channel) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-3xl bg-discord-chat/90">
        <div className="text-center">
          <div className="mb-2 text-5xl">🍪</div>
          <p className="text-lg text-discord-muted">Pick a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col border border-discord-active/50 bg-discord-chat/95">
      <div className="flex min-h-14 select-none items-center gap-2 border-b border-discord-active/50 px-4 py-2">
        <div className="rounded-xl bg-discord-sidebar p-2 text-discord-brand">
          <IconHash size={18} stroke={2.2} />
        </div>
        <span className="text-lg font-semibold text-discord-text">{props.channel.name}</span>
        {props.channel.topic && (
          <>
            <div className="mx-2 h-6 w-px bg-discord-active/80" />
            <span className="truncate text-sm text-discord-muted">{props.channel.topic}</span>
          </>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        <div className="mb-5 rounded-xl border border-discord-active/40 bg-discord-sidebar/60 px-4 py-3">
          <div className="mb-1.5 select-none text-2xl font-semibold leading-tight text-discord-text">Welcome to #{props.channel.name}</div>
          <p className="max-w-2xl select-none text-base leading-relaxed text-discord-muted">
            This is the start of the #{props.channel.name} channel.
            {props.channel.topic && ` ${props.channel.topic}`}
          </p>
        </div>

        {props.messages.map((msg, idx) => {
          const prev = idx > 0 ? props.messages[idx - 1] : null;
          const showHeader = !prev
            || prev.sender.toHexString() !== msg.sender.toHexString()
            || (msg.sent.toDate().getTime() - prev.sent.toDate().getTime()) > 5 * 60 * 1000;

          return (
            <MessageBubble
              key={msg.id.toString()}
              message={msg}
              user={props.getUserForMessage(msg)}
              getUserDisplayName={props.getUserDisplayName}
              thread={props.getThreadForMessage(msg.id)}
              isOwn={props.isOwnMessage(msg)}
              showHeader={showHeader}
              onEdit={(text) => props.onEditMessage(msg.id, text)}
              onDelete={() => props.onDeleteMessage(msg.id)}
              onCreateThread={() => props.onCreateThread(msg.id)}
              onOpenThread={props.onOpenThread}
            />
          );
        })}
      </div>

      <div className="px-4 pb-2">
        <MessageInput
          ref={inputRef}
          placeholder={`Message #${props.channel.name}`}
          onSend={props.onSendMessage}
          onTyping={props.onTyping}
        />
        <TypingIndicator users={props.typingUsers} getUserDisplayName={props.getUserDisplayName} />
      </div>
    </div>
  );
}

function TypingIndicator(props: { users: readonly User[]; getUserDisplayName: (u: User) => string }) {
  if (props.users.length === 0) return <div className="h-5" />;

  const names = props.users.map(u => props.getUserDisplayName(u));
  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return (
    <div className="flex h-5 select-none items-center gap-1 text-xs text-discord-muted">
      <span className="inline-flex gap-0.5">
        <span className="animate-bounce [animation-delay:0ms] text-base">.</span>
        <span className="animate-bounce [animation-delay:150ms] text-base">.</span>
        <span className="animate-bounce [animation-delay:300ms] text-base">.</span>
      </span>
      <span className="font-medium">{text}</span>
    </div>
  );
}
