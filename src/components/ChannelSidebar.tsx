import { useState } from 'react';
import clsx from 'clsx';
import {
  IconHash,
  IconPlus,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import type { Channel, User } from '../module_bindings/types';

interface ChannelSidebarProps {
  channels: readonly Channel[];
  selectedChannelId: bigint | null;
  currentUser: User | null;
  onSelectChannel: (id: bigint) => void;
  onCreateChannel: (name: string, topic: string) => void;
  onDeleteChannel: (id: bigint) => void;
  getUserDisplayName: (user: User) => string;
  onEditProfile: () => void;
}

export function ChannelSidebar(props: ChannelSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');

  function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (newChannelName.trim()) {
      props.onCreateChannel(newChannelName, newChannelTopic);
      setNewChannelName('');
      setNewChannelTopic('');
      setShowCreateModal(false);
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-discord-active/60 bg-discord-sidebar/90">
      <div className="flex h-12 items-center px-3">
        <div className="w-full select-none rounded-xl border border-discord-active/60 bg-discord-chat/80 px-3 py-2 text-sm font-semibold text-discord-text shadow-sm">
          Biscuit HQ
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="select-none text-[11px] font-bold uppercase tracking-[0.16em] text-discord-muted">
            Text Channels
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer select-none rounded-lg p-1.5 text-discord-muted transition-colors hover:bg-discord-hover hover:text-discord-text"
            title="Create Channel"
          >
            <IconPlus size={16} stroke={2.2} />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 px-0.5 pb-2">
        {props.channels.map(channel => (
          <ChannelItem
            key={channel.id.toString()}
            channel={channel}
            isSelected={props.selectedChannelId === channel.id}
            onSelect={() => props.onSelectChannel(channel.id)}
            onDelete={() => props.onDeleteChannel(channel.id)}
          />
        ))}
        </div>
      </div>

      <div className="m-2 mt-2 flex items-center gap-2 rounded-xl border border-discord-active/60 bg-discord-chat/80 px-2.5 py-2">
        {props.currentUser && (
          <>
            <div className="rounded-lg bg-discord-hover/50 p-0.5">
              <div
                className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg text-xs font-semibold text-discord-darker"
                style={{ backgroundColor: props.currentUser.avatarColor }}
              >
                {props.getUserDisplayName(props.currentUser).charAt(0).toUpperCase()}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-chat bg-discord-green" />
              </div>
            </div>
            <div className="min-w-0 flex-1 select-none">
              <div className="truncate text-sm font-semibold text-discord-text">
                {props.getUserDisplayName(props.currentUser)}
              </div>
              <div className="truncate text-[11px] text-discord-muted">Baking online</div>
            </div>
            <button
              onClick={props.onEditProfile}
              className="shrink-0 cursor-pointer select-none rounded-xl p-1.5 text-discord-muted transition-colors hover:bg-discord-hover hover:text-discord-text"
              title="User Settings"
            >
              <IconSettings size={18} stroke={2.1} />
            </button>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-[460px] rounded-3xl border border-discord-active bg-discord-sidebar px-6 py-5 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
            <h2 className="select-none text-2xl font-semibold text-discord-text">Create a new room</h2>
            <form onSubmit={handleCreateChannel} className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="select-none text-xs font-bold uppercase tracking-[0.16em] text-discord-muted">
                  Channel Name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-discord-active bg-discord-input px-3 py-2.5">
                  <IconHash size={16} className="text-discord-muted" />
                  <input
                    autoFocus
                    className="flex-1 border-none bg-transparent text-discord-text outline-none placeholder:text-discord-muted"
                    placeholder="tea-talk"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="select-none text-xs font-bold uppercase tracking-[0.16em] text-discord-muted">
                  Topic (optional)
                </label>
                <input
                  className="w-full rounded-xl border border-discord-active bg-discord-input px-3 py-2.5 text-discord-text outline-none placeholder:text-discord-muted"
                  placeholder="Talk all things cookies and crumbs"
                  value={newChannelTopic}
                  onChange={e => setNewChannelTopic(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer select-none rounded-xl px-4 py-2 text-sm text-discord-text transition-colors hover:bg-discord-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer select-none rounded-xl bg-discord-brand px-4 py-2 text-sm font-semibold text-discord-darker transition-colors hover:bg-discord-brand-hover"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelItem(props: {
  channel: Channel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') props.onSelect(); }}
      className={clsx(
        'group flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-left',
        'transition-colors',
        props.isSelected
          ? 'bg-discord-active text-discord-text shadow-sm'
          : 'text-discord-channel hover:bg-discord-hover hover:text-discord-text'
      )}
    >
      <IconHash size={16} stroke={2.2} className="shrink-0 opacity-80" />
      <span className="flex-1 truncate text-[13px] font-medium">{props.channel.name}</span>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          props.onDelete();
        }}
        className="invisible cursor-pointer rounded-lg p-1 text-discord-muted transition-colors group-hover:visible hover:bg-discord-hover hover:text-discord-red"
        title="Delete Channel"
      >
        <IconTrash size={14} stroke={2.2} />
      </button>
    </div>
  );
}
