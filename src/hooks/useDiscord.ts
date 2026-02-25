import { useState, useCallback, useRef, useEffect } from 'react';
import { tables, reducers } from '../module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import type { Thread, Message, User, Reaction } from '../module_bindings/types';

interface OptimisticToggle {
  messageId: bigint;
  emoji: string;
  identityHex: string;
  action: 'add' | 'remove';
}

export function useDiscord() {
  const { identity, isActive: connected } = useSpacetimeDB();

  const [channels] = useTable(tables.channel);
  const [allMessages] = useTable(tables.message);
  const [threads] = useTable(tables.thread);
  const [users] = useTable(tables.user);
  const [typingIndicators] = useTable(tables.typing_indicator);
  const [reactions] = useTable(tables.reaction);

  const setName = useReducer(reducers.setName);
  const createChannel = useReducer(reducers.createChannel);
  const deleteChannel = useReducer(reducers.deleteChannel);
  const updateChannelTopic = useReducer(reducers.updateChannelTopic);
  const sendMessage = useReducer(reducers.sendMessage);
  const editMessage = useReducer(reducers.editMessage);
  const deleteMessage = useReducer(reducers.deleteMessage);
  const createThread = useReducer(reducers.createThread);
  const sendThreadReply = useReducer(reducers.sendThreadReply);
  const setTyping = useReducer(reducers.setTyping);
  const clearTyping = useReducer(reducers.clearTyping);
  const toggleReaction = useReducer(reducers.toggleReaction);

  const [selectedChannelId, setSelectedChannelId] = useState<bigint | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<bigint | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [optimisticToggles, setOptimisticToggles] = useState<OptimisticToggle[]>([]);

  useEffect(() => {
    setOptimisticToggles(prev => {
      if (prev.length === 0) return prev;
      const next = prev.filter(toggle => {
        const serverHas = reactions.some(r =>
          r.messageId === toggle.messageId &&
          r.emoji === toggle.emoji &&
          r.reactor.toHexString() === toggle.identityHex
        );
        return toggle.action === 'add' ? !serverHas : serverHas;
      });
      return next.length < prev.length ? next : prev;
    });
  }, [reactions]);

  const currentChannel = selectedChannelId !== null
    ? channels.find(c => c.id === selectedChannelId) ?? null
    : channels[0] ?? null;

  const activeChannelId = currentChannel?.id ?? null;

  const channelMessages = allMessages.filter(
    m => m.channelId === activeChannelId && m.threadId === 0n
  ).sort((a, b) => (a.sent.toDate() > b.sent.toDate() ? 1 : -1));

  const selectedThread = selectedThreadId !== null
    ? threads.find(t => t.id === selectedThreadId) ?? null
    : null;

  const threadMessages = selectedThreadId !== null
    ? allMessages.filter(m => m.threadId === selectedThreadId)
        .sort((a, b) => (a.sent.toDate() > b.sent.toDate() ? 1 : -1))
    : [];

  const channelThreads = activeChannelId !== null
    ? threads.filter(t => t.channelId === activeChannelId)
    : [];

  const onlineUsers = users.filter(u => u.online);
  const offlineUsers = users.filter(u => !u.online);

  const currentUser = identity
    ? users.find(u => u.identity.toHexString() === identity.toHexString()) ?? null
    : null;

  function getChannelTypingUsers(channelId: bigint, threadId: bigint): User[] {
    const now = Date.now();
    return typingIndicators
      .filter(ti => {
        if (ti.channelId !== channelId || ti.threadId !== threadId) return false;
        if (identity && ti.identity.toHexString() === identity.toHexString()) return false;
        const elapsed = now - ti.startedAt.toDate().getTime();
        return elapsed < 8000;
      })
      .map(ti => users.find(u => u.identity.toHexString() === ti.identity.toHexString()))
      .filter((u): u is User => u !== undefined);
  }

  function getUserDisplayName(user: User): string {
    return user.username ?? user.identity.toHexString().substring(0, 8);
  }

  function getUserForMessage(msg: Message): User | undefined {
    return users.find(u => u.identity.toHexString() === msg.sender.toHexString());
  }

  function getThreadForMessage(msgId: bigint): Thread | undefined {
    return threads.find(t => t.parentMessageId === msgId);
  }

  function getReactionsForMessage(msgId: bigint): Reaction[] {
    const serverReactions = reactions.filter(r => r.messageId === msgId);
    const relevant = optimisticToggles.filter(t => t.messageId === msgId);
    if (relevant.length === 0) return serverReactions;

    const result = [...serverReactions];
    for (const toggle of relevant) {
      if (toggle.action === 'remove') {
        const idx = result.findIndex(r =>
          r.emoji === toggle.emoji && r.reactor.toHexString() === toggle.identityHex
        );
        if (idx !== -1) result.splice(idx, 1);
      } else {
        const exists = result.some(r =>
          r.emoji === toggle.emoji && r.reactor.toHexString() === toggle.identityHex
        );
        if (!exists && identity) {
          result.push({ id: 0n, messageId: msgId, emoji: toggle.emoji, reactor: identity } as Reaction);
        }
      }
    }
    return result;
  }

  function handleToggleReaction(messageId: bigint, emoji: string) {
    if (!identity) return;
    const identityHex = identity.toHexString();

    const serverHas = reactions.some(r =>
      r.messageId === messageId && r.emoji === emoji && r.reactor.toHexString() === identityHex
    );
    const existing = optimisticToggles.find(t =>
      t.messageId === messageId && t.emoji === emoji && t.identityHex === identityHex
    );
    const effectivelyHas = existing ? existing.action === 'add' : serverHas;

    setOptimisticToggles(prev => [
      ...prev.filter(t => !(t.messageId === messageId && t.emoji === emoji && t.identityHex === identityHex)),
      { messageId, emoji, identityHex, action: effectivelyHas ? 'remove' : 'add' },
    ]);

    toggleReaction({ messageId, emoji });
  }

  function isOwnMessage(msg: Message): boolean {
    if (!identity) return false;
    return msg.sender.toHexString() === identity.toHexString();
  }

  const handleSendTyping = useCallback((channelId: bigint, threadId: bigint) => {
    setTyping({ channelId, threadId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      clearTyping();
    }, 5000);
  }, [setTyping, clearTyping]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    clearTyping();
  }, [clearTyping]);

  return {
    connected,
    identity,
    channels,
    channelMessages,
    threadMessages,
    channelThreads,
    threads,
    onlineUsers,
    offlineUsers,
    users,
    currentUser,
    currentChannel,
    selectedChannelId: activeChannelId,
    selectedThread,
    selectedThreadId,
    setSelectedChannelId,
    setSelectedThreadId,
    setName,
    createChannel,
    deleteChannel,
    updateChannelTopic,
    sendMessage,
    editMessage,
    deleteMessage,
    createThread,
    sendThreadReply,
    handleSendTyping,
    handleStopTyping,
    clearTyping,
    handleToggleReaction,
    getChannelTypingUsers,
    getUserDisplayName,
    getUserForMessage,
    getThreadForMessage,
    getReactionsForMessage,
    isOwnMessage,
  };
}

export type DiscordState = ReturnType<typeof useDiscord>;
