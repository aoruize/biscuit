import clsx from 'clsx';
import { IconPlus } from '@tabler/icons-react';

interface ServerSidebarProps {
  serverName: string;
}

export function ServerSidebar(props: ServerSidebarProps) {
  return (
    <div className="flex h-full w-[68px] flex-col items-center gap-3 bg-discord-darker/80 py-4 backdrop-blur">
      <div
        className={clsx(
          'flex h-10 w-10 select-none items-center justify-center rounded-xl',
          'bg-gradient-to-br from-discord-brand to-discord-brand-hover text-discord-darker font-bold text-lg shadow-lg shadow-black/30',
          'cursor-pointer transition-[transform,box-shadow] duration-200',
          'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40'
        )}
        title={props.serverName}
      >
        {props.serverName.charAt(0).toUpperCase()}
      </div>
      <div className="mx-auto h-px w-10 rounded-full bg-discord-active" />
      <div
        className={clsx(
          'mt-1 flex h-10 w-10 select-none items-center justify-center rounded-xl border border-discord-active',
          'bg-discord-sidebar text-discord-brand',
          'cursor-pointer transition-[transform,background-color,color] duration-200',
          'hover:-translate-y-0.5 hover:bg-discord-hover hover:text-discord-text'
        )}
        title="Add a server"
      >
        <IconPlus size={22} stroke={2.2} />
      </div>
      <div className="flex-1" />
    </div>
  );
}
