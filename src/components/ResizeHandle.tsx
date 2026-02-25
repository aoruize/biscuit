import clsx from 'clsx';

interface ResizeHandleProps {
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  side?: 'right' | 'left';
}

export function ResizeHandle(props: ResizeHandleProps) {
  const { side = 'right' } = props;

  return (
    <div
      onMouseDown={props.onMouseDown}
      className={clsx(
        'absolute top-0 z-10 h-full w-1 cursor-col-resize transition-opacity',
        side === 'right' ? 'right-0' : 'left-0',
        props.isDragging
          ? 'bg-discord-brand opacity-100'
          : 'opacity-0 hover:bg-discord-brand/60 hover:opacity-100'
      )}
    />
  );
}
