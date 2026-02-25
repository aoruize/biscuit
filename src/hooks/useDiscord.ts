import { useState, useCallback, useRef } from 'react';
import { tables, reducers } from '../module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import type { Thread, Message, User, Reaction } from '../module_bindings/types';

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
    return reactions.filter(r => r.messageId === msgId);
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
    toggleReaction,
    getChannelTypingUsers,
    getUserDisplayName,
    getUserForMessage,
    getThreadForMessage,
    getReactionsForMessage,
    isOwnMessage,
  };
}

export type DiscordState = ReturnType<typeof useDiscord>;
