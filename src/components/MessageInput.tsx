import { useRef, useImperativeHandle, forwardRef } from 'react';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';

interface MessageInputProps {
  placeholder: string;
  onSend: (text: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  onDraftChange?: (markdown: string) => void;
}

export interface MessageInputHandle {
  focus: () => void;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput(props, ref) {
    const editorRef = useRef<RichTextEditorHandle>(null);

    useImperativeHandle(ref, () => ({
      focus() {
        editorRef.current?.focus();
      },
    }));

    return (
      <RichTextEditor
        ref={editorRef}
        placeholder={props.placeholder}
        onSend={props.onSend}
        onTyping={props.onTyping}
        onStopTyping={props.onStopTyping}
        onDraftChange={props.onDraftChange}
      />
    );
  }
);
