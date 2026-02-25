import { useRef, useImperativeHandle, forwardRef } from 'react';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';

interface MessageInputProps {
  placeholder: string;
  initialContent?: string;
  onSend: (text: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  onDraftChange?: (markdown: string) => void;
  onNavigateUp?: () => void;
}

export interface MessageInputHandle {
  focus: () => void;
  blur: () => void;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput(props, ref) {
    const editorRef = useRef<RichTextEditorHandle>(null);

    useImperativeHandle(ref, () => ({
      focus() {
        editorRef.current?.focus();
      },
      blur() {
        editorRef.current?.blur();
      },
    }));

    return (
      <RichTextEditor
        ref={editorRef}
        placeholder={props.placeholder}
        initialContent={props.initialContent}
        onSend={props.onSend}
        onTyping={props.onTyping}
        onStopTyping={props.onStopTyping}
        onDraftChange={props.onDraftChange}
        onNavigateUp={props.onNavigateUp}
      />
    );
  }
);
