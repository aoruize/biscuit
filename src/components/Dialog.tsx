import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}

export function Dialog(props: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={props.onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'flex w-full flex-col gap-5 rounded-3xl border border-discord-active bg-discord-sidebar px-6 py-5 shadow-2xl shadow-black/50',
          props.maxWidth ?? 'max-w-[460px]'
        )}
      >
        <h2 className="select-none text-xl font-semibold text-discord-text">
          {props.title}
        </h2>
        {props.children}
      </div>
    </div>
  );
}

interface DialogFooterProps {
  cancelLabel?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit?: () => void;
  submitType?: 'button' | 'submit';
}

export function DialogFooter(props: DialogFooterProps) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={props.onCancel}
        className="cursor-pointer select-none rounded-xl px-4 py-2 text-sm text-discord-text transition-colors hover:bg-discord-hover"
      >
        {props.cancelLabel ?? 'Cancel'}
      </button>
      <button
        type={props.submitType ?? 'submit'}
        onClick={props.onSubmit}
        className="cursor-pointer select-none rounded-xl bg-discord-brand px-4 py-2 text-sm font-semibold text-discord-darker transition-colors hover:bg-discord-brand-hover"
      >
        {props.submitLabel}
      </button>
    </div>
  );
}
