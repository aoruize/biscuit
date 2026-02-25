import { useState, useRef, useCallback } from 'react';
import { IconCirclePlus } from '@tabler/icons-react';

interface MessageInputProps {
  placeholder: string;
  onSend: (text: string) => void;
  onTyping: () => void;
}

export function MessageInput(props: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 300) + 'px';
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        props.onSend(text.trim());
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    props.onTyping();
    adjustHeight();
  }

  return (
    <div className="flex items-end rounded-xl border border-discord-active/70 bg-discord-input/90 px-3 py-2 shadow-inner">
      <button className="mb-0.5 mr-2 shrink-0 cursor-pointer select-none rounded-lg p-1 text-discord-channel transition-colors hover:bg-discord-hover hover:text-discord-brand">
        <IconCirclePlus size={22} stroke={2} />
      </button>
      <textarea
        ref={textareaRef}
        className="max-h-[300px] flex-1 resize-none border-none bg-transparent py-0.5 text-[15px] leading-6 text-discord-text outline-none placeholder:text-discord-muted"
        placeholder={props.placeholder}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
      />
    </div>
  );
}
