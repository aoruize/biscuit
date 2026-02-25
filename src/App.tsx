import { useState, useRef, useEffect, useCallback } from 'react';
import { useDiscord } from './hooks/useDiscord';
import { useResizablePanel } from './hooks/useResizablePanel';
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { MessageArea } from './components/MessageArea';
import { ThreadPanel } from './components/ThreadPanel';
import { MemberList } from './components/MemberList';
import { ProfileModal } from './components/ProfileModal';
import { ResizeHandle } from './components/ResizeHandle';
import { GlobalContextMenuProvider } from './components/contextMenu/GlobalContextMenu';
import { GlobalEmojiPicker } from './components/emojiPicker/EmojiPicker';

function App() {
  const discord = useDiscord();
  const [showProfile, setShowProfile] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const showMembers = true;
  const pendingThreadMsgRef = useRef<bigint | null>(null);
  const [threadFocusKey, setThreadFocusKey] = useState(0);

  useEffect(() => {
    if (pendingThreadMsgRef.current === null) return;
    const thread = discord.threads.find(t => t.parentMessageId === pendingThreadMsgRef.current);
    if (thread) {
      discord.setSelectedThreadId(thread.id);
      pendingThreadMsgRef.current = null;
    }
  }, [discord.threads]);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebar = useResizablePanel({ defaultWidth: 256, minWidth: 160, maxWidth: 420, persistKey: 'sidebar-width' });

  const THREAD_MIN_WIDTH = 280;
  const getMessageAreaMax = useCallback(
    () => (contentRef.current?.clientWidth ?? 900) - THREAD_MIN_WIDTH,
    []
  );
  const messageArea = useResizablePanel({ defaultWidth: 600, minWidth: 300, maxWidth: getMessageAreaMax, persistKey: 'message-area-width' });

  function handleSendMessage(text: string) {
    if (discord.selectedChannelId !== null) {
      discord.handleSendMessage(discord.selectedChannelId, text);
    }
  }

  function handleSendThreadReply(text: string, alsoSendToChannel: boolean) {
    if (discord.selectedThreadId !== null) {
      discord.handleSendThreadReply(discord.selectedThreadId, text, alsoSendToChannel);
    }
  }

  function handleCreateThread(messageId: bigint) {
    const existingThread = discord.getThreadForMessage(messageId);
    if (existingThread) {
      discord.setSelectedThreadId(existingThread.id);
      setThreadFocusKey(k => k + 1);
      return;
    }
    if (discord.selectedChannelId === null) return;
    const msg = discord.channelMessages.find(m => m.id === messageId);
    const threadName = msg ? msg.text.substring(0, 50) : 'Thread';
    pendingThreadMsgRef.current = messageId;
    discord.createThread({
      channelId: discord.selectedChannelId,
      parentMessageId: messageId,
      name: threadName,
    });
    setThreadFocusKey(k => k + 1);
  }

  function handleChannelTyping() {
    if (discord.selectedChannelId !== null) {
      discord.handleSendTyping(discord.selectedChannelId, 0n);
    }
  }

  function handleThreadTyping() {
    if (discord.selectedChannelId !== null && discord.selectedThreadId !== null) {
      discord.handleSendTyping(discord.selectedChannelId, discord.selectedThreadId);
    }
  }

  function handleStopTyping() {
    discord.handleStopTyping();
  }

  function highlightMessage(id: string) {
    setHighlightedMessageId(id);
    setTimeout(() => setHighlightedMessageId(null), 2000);
  }

  function handleNavigateToThread(threadId: bigint, messageId: bigint) {
    discord.setSelectedThreadId(threadId);
    setTimeout(() => highlightMessage(messageId.toString()), 100);
  }

  const myIdentityHex = discord.identity?.toHexString() ?? null;

  const parentMessage = discord.selectedThread
    ? discord.channelMessages.find(m => m.id === discord.selectedThread!.parentMessageId)
    : undefined;

  if (!discord.connected || !discord.identity) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="rounded-3xl border border-discord-active bg-discord-sidebar/80 px-12 py-10 text-center shadow-2xl shadow-black/50 backdrop-blur">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent" />
          <p className="text-lg text-discord-muted">Warming up Biscuit...</p>
        </div>
      </div>
    );
  }

  return (
    <GlobalContextMenuProvider>
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden bg-discord-dark/70 shadow-2xl shadow-black/50 backdrop-blur">
        <ServerSidebar serverName="Biscuit" />

        <div className="relative flex h-full shrink-0" style={{ width: sidebar.width }}>
          <ChannelSidebar
            channels={discord.channels}
            selectedChannelId={discord.selectedChannelId}
            currentUser={discord.currentUser}
            starredChannelIds={discord.myStarredChannelIds}
            channelHasDraft={discord.hasDraft}
            onSelectChannel={(id) => {
              discord.setSelectedChannelId(id);
              discord.setSelectedThreadId(null);
            }}
            onCreateChannel={(name, topic) => discord.createChannel({ name, topic })}
            onDeleteChannel={(id) => discord.deleteChannel({ channelId: id })}
            onToggleStar={(id) => discord.handleToggleStar(id)}
            getUserDisplayName={discord.getUserDisplayName}
            onEditProfile={() => setShowProfile(true)}
          />
          <ResizeHandle isDragging={sidebar.isDragging} onMouseDown={sidebar.handleMouseDown} side="right" />
        </div>

        <div ref={contentRef} className="flex min-w-0 flex-1">
          <div
            className="relative flex h-full min-w-0 shrink-0"
            style={discord.selectedThread ? { width: messageArea.width } : { flex: '1 1 0%' }}
          >
            <MessageArea
              channel={discord.currentChannel}
              messages={discord.channelMessages}
              threads={discord.threads}
              getUserForMessage={discord.getUserForMessage}
              getUserDisplayName={discord.getUserDisplayName}
              getThreadForMessage={discord.getThreadForMessage}
              getReactionsForMessage={discord.getReactionsForMessage}
              isOwnMessage={discord.isOwnMessage}
              myIdentityHex={myIdentityHex}
              highlightedMessageId={highlightedMessageId}
              typingUsers={discord.selectedChannelId !== null ? discord.getChannelTypingUsers(discord.selectedChannelId, 0n) : []}
              onSendMessage={handleSendMessage}
              onEditMessage={(id, text) => discord.editMessage({ messageId: id, text })}
              onDeleteMessage={(id) => discord.deleteMessage({ messageId: id })}
              onCreateThread={handleCreateThread}
              onOpenThread={(id) => { discord.setSelectedThreadId(id); setThreadFocusKey(k => k + 1); }}
              onToggleReaction={discord.handleToggleReaction}
              onNavigateToThread={handleNavigateToThread}
              onTyping={handleChannelTyping}
              onStopTyping={handleStopTyping}
              onDraftChange={(md) => {
                if (discord.selectedChannelId !== null) {
                  discord.setDraft(discord.selectedChannelId, md);
                }
              }}
              draft={discord.selectedChannelId !== null ? discord.getDraft(discord.selectedChannelId) : undefined}
            />
            {discord.selectedThread && (
              <ResizeHandle isDragging={messageArea.isDragging} onMouseDown={messageArea.handleMouseDown} side="right" />
            )}
          </div>

          {discord.selectedThread && (
            <ThreadPanel
              thread={discord.selectedThread}
              focusKey={threadFocusKey}
              channelName={discord.currentChannel?.name ?? ''}
              parentMessage={parentMessage}
              messages={discord.threadMessages}
              getUserForMessage={discord.getUserForMessage}
              getUserDisplayName={discord.getUserDisplayName}
              getReactionsForMessage={discord.getReactionsForMessage}
              isOwnMessage={discord.isOwnMessage}
              myIdentityHex={myIdentityHex}
              highlightedMessageId={highlightedMessageId}
              typingUsers={discord.selectedChannelId !== null && discord.selectedThreadId !== null
                ? discord.getChannelTypingUsers(discord.selectedChannelId, discord.selectedThreadId)
                : []
              }
              onSendReply={handleSendThreadReply}
              onEditMessage={(id, text) => discord.editMessage({ messageId: id, text })}
              onDeleteMessage={(id) => discord.deleteMessage({ messageId: id })}
              onToggleReaction={discord.handleToggleReaction}
              onClose={() => discord.setSelectedThreadId(null)}
              onNavigateToChannelMessage={(msgId) => {
                highlightMessage(msgId.toString());
              }}
              onTyping={handleThreadTyping}
              onStopTyping={handleStopTyping}
            />
          )}

          {!discord.selectedThread && showMembers && (
            <MemberList
              onlineUsers={discord.onlineUsers}
              offlineUsers={discord.offlineUsers}
              getUserDisplayName={discord.getUserDisplayName}
            />
          )}
        </div>
      </div>

      {showProfile && discord.currentUser && (
        <ProfileModal
          currentUser={discord.currentUser}
          getUserDisplayName={discord.getUserDisplayName}
          onSetName={(name) => discord.setName({ username: name })}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
    <GlobalEmojiPicker />
    </GlobalContextMenuProvider>
  );
}

export default App;
