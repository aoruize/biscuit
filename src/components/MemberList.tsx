import clsx from 'clsx';
import { IconUsers } from '@tabler/icons-react';
import type { User } from '../module_bindings/types';

interface MemberListProps {
  onlineUsers: readonly User[];
  offlineUsers: readonly User[];
  getUserDisplayName: (user: User) => string;
}

export function MemberList(props: MemberListProps) {
  return (
    <div className="ml-2 flex h-full w-56 shrink-0 flex-col border border-discord-active/60 bg-discord-sidebar/90">
      <div className="flex select-none items-center gap-2 border-b border-discord-active/50 px-3 py-2.5">
        <IconUsers size={16} className="text-discord-brand" />
        <div className="text-base font-semibold text-discord-text">People</div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <MemberSection
          title={`Online — ${props.onlineUsers.length}`}
          users={props.onlineUsers}
          isOnline
          getUserDisplayName={props.getUserDisplayName}
        />
        {props.offlineUsers.length > 0 && (
          <MemberSection
            title={`Offline — ${props.offlineUsers.length}`}
            users={props.offlineUsers}
            isOnline={false}
            getUserDisplayName={props.getUserDisplayName}
          />
        )}
      </div>
    </div>
  );
}

function MemberSection(props: {
  title: string;
  users: readonly User[];
  isOnline: boolean;
  getUserDisplayName: (user: User) => string;
}) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 select-none px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-discord-muted">
        {props.title}
      </div>
      {props.users.map(user => (
        <MemberItem
          key={user.identity.toHexString()}
          user={user}
          isOnline={props.isOnline}
          getUserDisplayName={props.getUserDisplayName}
        />
      ))}
    </div>
  );
}

function MemberItem(props: {
  user: User;
  isOnline: boolean;
  getUserDisplayName: (user: User) => string;
}) {
  const name = props.getUserDisplayName(props.user);

  return (
    <div
      className={clsx(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-1.5 py-1.5',
        'transition-colors hover:bg-discord-hover/60',
        !props.isOnline && 'opacity-40'
      )}
    >
      <div className="relative">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold text-discord-darker"
          style={{ backgroundColor: props.user.avatarColor }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-discord-sidebar',
            props.isOnline ? 'bg-discord-green' : 'bg-discord-muted'
          )}
        />
      </div>
      <span className={clsx(
        'truncate text-[13px] font-medium',
        props.isOnline ? 'text-discord-text' : 'text-discord-muted'
      )}>
        {name}
      </span>
    </div>
  );
}
