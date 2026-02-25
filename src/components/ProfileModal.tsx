import { useState } from 'react';
import { IconCookie } from '@tabler/icons-react';
import type { User } from '../module_bindings/types';

interface ProfileModalProps {
  currentUser: User;
  getUserDisplayName: (user: User) => string;
  onSetName: (name: string) => void;
  onClose: () => void;
}

export function ProfileModal(props: ProfileModalProps) {
  const [username, setUsername] = useState(props.currentUser.username ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim()) {
      props.onSetName(username.trim());
      props.onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={props.onClose}>
      <div className="flex w-full max-w-[460px] flex-col gap-5 rounded-3xl border border-discord-active bg-discord-sidebar px-6 py-5 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
        <h2 className="flex select-none items-center gap-2 text-xl font-semibold text-discord-text">
          <IconCookie size={20} className="text-discord-brand" />
          Biscuit Profile
        </h2>

        <div className="flex items-center gap-4 rounded-2xl border border-discord-active/60 bg-discord-chat/70 p-4">
          <div
            className="flex h-20 w-20 shrink-0 select-none items-center justify-center rounded-2xl text-2xl font-bold text-discord-darker"
            style={{ backgroundColor: props.currentUser.avatarColor }}
          >
            {props.getUserDisplayName(props.currentUser).charAt(0).toUpperCase()}
          </div>
          <div className="select-none">
            <div className="text-lg font-semibold text-discord-text">
              {props.getUserDisplayName(props.currentUser)}
            </div>
            <div className="text-sm text-discord-muted">
              {props.currentUser.identity.toHexString().substring(0, 16)}...
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="select-none text-xs font-bold uppercase tracking-wide text-discord-muted">
              Display Name
            </label>
            <input
              autoFocus
              className="w-full rounded-xl border border-discord-active bg-discord-input px-3 py-2.5 text-discord-text outline-none placeholder:text-discord-muted focus:ring-2 focus:ring-discord-brand"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={32}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={props.onClose}
              className="cursor-pointer select-none rounded-xl px-4 py-2 text-sm text-discord-text transition-colors hover:bg-discord-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer select-none rounded-xl bg-discord-brand px-4 py-2 text-sm font-semibold text-discord-darker transition-colors hover:bg-discord-brand-hover"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
