import { useState, useRef, useEffect } from 'react';
import { useDiscord } from './hooks/useDiscord';
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { MessageArea } from './components/MessageArea';
import { ThreadPanel } from './components/ThreadPanel';
import { MemberList } from './components/MemberList';
import { ProfileModal } from './components/ProfileModal';

function App() {
  const discord = useDiscord();
  const [showProfile, setShowProfile] = useState(false);
  const showMembers = true;
  const pendingThreadMsgRef = useRef<bigint | null>(null);

  useEffect(() => {
    if (pendingThreadMsgRef.current === null) return;
    const thread = discord.threads.find(t => t.parentMessageId === pendingThreadMsgRef.current);
    if (thread) {
      discord.setSelectedThreadId(thread.id);
      pendingThreadMsgRef.current = null;
    }
  }, [discord.threads]);

  function handleSendMessage(text: string) {
    if (discord.selectedChannelId !== null) {
      discord.sendMessage({ channelId: discord.selectedChannelId, text });
    }
  }

  function handleSendThreadReply(text: string) {
    if (discord.selectedThreadId !== null) {
      discord.sendThreadReply({ threadId: discord.selectedThreadId, text });
    }
  }

  function handleCreateThread(messageId: bigint) {
    if (discord.selectedChannelId === null) return;
    const existingThread = discord.getThreadForMessage(messageId);
    if (existingThread) {
      discord.setSelectedThreadId(existingThread.id);
      return;
    }
    const msg = discord.channelMessages.find(m => m.id === messageId);
    const threadName = msg ? msg.text.substring(0, 50) : 'Thread';
    pendingThreadMsgRef.current = messageId;
    discord.createThread({
      channelId: discord.selectedChannelId,
      parentMessageId: messageId,
      name: threadName,
    });
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
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden bg-discord-dark/70 shadow-2xl shadow-black/50 backdrop-blur">
        <ServerSidebar serverName="Biscuit" />

        <ChannelSidebar
          channels={discord.channels}
          selectedChannelId={discord.selectedChannelId}
          currentUser={discord.currentUser}
          onSelectChannel={(id) => {
            discord.setSelectedChannelId(id);
            discord.setSelectedThreadId(null);
          }}
          onCreateChannel={(name, topic) => discord.createChannel({ name, topic })}
          onDeleteChannel={(id) => discord.deleteChannel({ channelId: id })}
          getUserDisplayName={discord.getUserDisplayName}
          onEditProfile={() => setShowProfile(true)}
        />

        <div className="ml-2 flex min-w-0 flex-1">
          <MessageArea
            channel={discord.currentChannel}
            messages={discord.channelMessages}
            getUserForMessage={discord.getUserForMessage}
            getUserDisplayName={discord.getUserDisplayName}
            getThreadForMessage={discord.getThreadForMessage}
            isOwnMessage={discord.isOwnMessage}
            typingUsers={discord.selectedChannelId !== null ? discord.getChannelTypingUsers(discord.selectedChannelId, 0n) : []}
            onSendMessage={handleSendMessage}
            onEditMessage={(id, text) => discord.editMessage({ messageId: id, text })}
            onDeleteMessage={(id) => discord.deleteMessage({ messageId: id })}
            onCreateThread={handleCreateThread}
            onOpenThread={(id) => discord.setSelectedThreadId(id)}
            onTyping={handleChannelTyping}
          />

          {discord.selectedThread && (
            <ThreadPanel
              thread={discord.selectedThread}
              parentMessage={parentMessage}
              messages={discord.threadMessages}
              getUserForMessage={discord.getUserForMessage}
              getUserDisplayName={discord.getUserDisplayName}
              isOwnMessage={discord.isOwnMessage}
              typingUsers={discord.selectedChannelId !== null && discord.selectedThreadId !== null
                ? discord.getChannelTypingUsers(discord.selectedChannelId, discord.selectedThreadId)
                : []
              }
              onSendReply={handleSendThreadReply}
              onEditMessage={(id, text) => discord.editMessage({ messageId: id, text })}
              onDeleteMessage={(id) => discord.deleteMessage({ messageId: id })}
              onClose={() => discord.setSelectedThreadId(null)}
              onTyping={handleThreadTyping}
            />
          )}

          {showMembers && (
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
  );
}

export default App;
