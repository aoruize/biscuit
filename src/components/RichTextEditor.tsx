import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown, type MarkdownStorage } from 'tiptap-markdown';
import { Extension } from '@tiptap/core';
import clsx from 'clsx';
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconBlockquote,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconH1,
  IconH2,
  IconLink,
  IconCodeDots,
} from '@tabler/icons-react';
import { Tooltip } from './Tooltip';

interface RichTextEditorProps {
  placeholder: string;
  initialContent?: string;
  onSend?: (markdown: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onEscape?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}

export interface RichTextEditorHandle {
  focus: () => void;
  getMarkdown: () => string;
  clearContent: () => void;
}

function getEditorMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as Record<string, MarkdownStorage>;
  return storage['markdown'].getMarkdown();
}

function createEnterToSendExtension(onSend: () => void) {
  return Extension.create({
    name: 'enterToSend',
    addKeyboardShortcuts() {
      return {
        Enter: () => {
          onSend();
          return true;
        },
      };
    },
  });
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(props, ref) {
    const propsRef = useRef(props);
    propsRef.current = props;
    const wasEmptyRef = useRef(true);

    const handleSend = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const md = getEditorMarkdown(editor);
      if (!md.trim()) return;
      propsRef.current.onSend?.(md.trim());
      editor.commands.clearContent(true);
      wasEmptyRef.current = true;
      propsRef.current.onStopTyping?.();
    }, []);

    const enterToSend = useRef(
      props.onSend ? createEnterToSendExtension(handleSend) : null
    );

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Link.configure({ openOnClick: false, autolink: true }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: props.placeholder }),
        Markdown.configure({
          html: false,
          transformPastedText: true,
          breaks: true,
        }),
        ...(enterToSend.current ? [enterToSend.current] : []),
      ],
      content: props.initialContent ?? '',
      autofocus: props.autoFocus ? 'end' : false,
      editorProps: {
        attributes: {
          class: 'tiptap-editor outline-none',
        },
        handleKeyDown(_view, event) {
          if (event.key === 'Escape') {
            propsRef.current.onEscape?.();
            return true;
          }
          return false;
        },
      },
      onUpdate({ editor: e }) {
        const isEmpty = e.isEmpty;
        if (isEmpty && !wasEmptyRef.current) {
          propsRef.current.onStopTyping?.();
        } else if (!isEmpty && wasEmptyRef.current) {
          propsRef.current.onTyping?.();
        }
        wasEmptyRef.current = isEmpty;
      },
    });

    const editorRef = useRef<Editor | null>(editor);
    editorRef.current = editor;

    useImperativeHandle(ref, () => ({
      focus() {
        editorRef.current?.commands.focus();
      },
      getMarkdown() {
        if (!editorRef.current) return '';
        return getEditorMarkdown(editorRef.current);
      },
      clearContent() {
        editorRef.current?.commands.clearContent(true);
      },
    }));

    useEffect(() => {
      return () => {
        editorRef.current?.destroy();
      };
    }, []);

    if (!editor) return null;

    return (
      <div
        className={clsx(
          'flex flex-col rounded-xl border border-discord-active/70 bg-discord-input/90 shadow-inner',
          props.compact && 'text-sm'
        )}
      >
        <Toolbar editor={editor} compact={props.compact} />
        <div className="px-3 py-2">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

interface ToolbarProps {
  editor: Editor;
  compact?: boolean;
}

interface ToolbarButtonDef {
  label: string;
  icon: React.ReactNode;
  action: (e: Editor) => void;
  isActive?: (e: Editor) => boolean;
}

const ICON_SIZE = 16;
const ICON_STROKE = 2;

const toolbarButtons: ToolbarButtonDef[] = [
  {
    label: 'Bold',
    icon: <IconBold size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive('bold'),
  },
  {
    label: 'Italic',
    icon: <IconItalic size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive('italic'),
  },
  {
    label: 'Strikethrough',
    icon: <IconStrikethrough size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleStrike().run(),
    isActive: (e) => e.isActive('strike'),
  },
  {
    label: 'Inline code',
    icon: <IconCode size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleCode().run(),
    isActive: (e) => e.isActive('code'),
  },
  {
    label: 'Code block',
    icon: <IconCodeDots size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e.isActive('codeBlock'),
  },
  {
    label: 'Heading 1',
    icon: <IconH1 size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive('heading', { level: 1 }),
  },
  {
    label: 'Heading 2',
    icon: <IconH2 size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive('heading', { level: 2 }),
  },
  {
    label: 'Bullet list',
    icon: <IconList size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive('bulletList'),
  },
  {
    label: 'Numbered list',
    icon: <IconListNumbers size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive('orderedList'),
  },
  {
    label: 'Task list',
    icon: <IconListCheck size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleTaskList().run(),
    isActive: (e) => e.isActive('taskList'),
  },
  {
    label: 'Blockquote',
    icon: <IconBlockquote size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive('blockquote'),
  },
  {
    label: 'Link',
    icon: <IconLink size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => {
      if (e.isActive('link')) {
        e.chain().focus().unsetLink().run();
        return;
      }
      const url = window.prompt('URL');
      if (url) {
        e.chain().focus().setLink({ href: url }).run();
      }
    },
    isActive: (e) => e.isActive('link'),
  },
];

function Toolbar(props: ToolbarProps) {
  const activeStates = useEditorState({
    editor: props.editor,
    selector: (ctx) => {
      const e = ctx.editor;
      return toolbarButtons.map((btn) => btn.isActive?.(e) ?? false);
    },
  });

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-discord-active/40 px-2 py-1">
      {toolbarButtons.map((btn, i) => (
        <Tooltip key={btn.label} content={btn.label}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => btn.action(props.editor)}
            className={clsx(
              'cursor-pointer rounded-md p-1.5 transition-colors',
              activeStates[i]
                ? 'bg-discord-active/60 text-discord-brand'
                : 'text-discord-muted hover:bg-discord-hover/50 hover:text-discord-text'
            )}
          >
            {btn.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
