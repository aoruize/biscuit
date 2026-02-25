import { useState } from 'react';
import { IconCookie } from '@tabler/icons-react';
import type { User } from '../module_bindings/types';
import { Dialog, DialogFooter } from './Dialog';

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
    <Dialog
      open
      onClose={props.onClose}
      title={
        <span className="flex items-center gap-2">
          <IconCookie size={20} className="text-discord-brand" />
          Biscuit Profile
        </span>
      }
    >

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
        <DialogFooter onCancel={props.onClose} submitLabel="Save" />
      </form>
    </Dialog>
  );
}
