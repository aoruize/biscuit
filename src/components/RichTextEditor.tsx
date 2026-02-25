import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
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
  IconH1,
  IconH2,
  IconLink,
  IconCodeDots,
} from '@tabler/icons-react';
import { Tooltip } from './Tooltip';
import { Dialog, DialogFooter } from './Dialog';

interface RichTextEditorProps {
  placeholder: string;
  initialContent?: string;
  onSend?: (markdown: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onDraftChange?: (markdown: string) => void;
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
        'Shift-Enter': ({ editor }) => {
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            return editor.commands.splitListItem('listItem');
          }
          if (editor.isActive('blockquote')) {
            return editor.commands.splitBlock();
          }
          return editor.commands.first([
            () => editor.commands.newlineInCode(),
            () => editor.commands.createParagraphNear(),
            () => editor.commands.liftEmptyBlock(),
            () => editor.commands.splitBlock(),
          ]);
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
      propsRef.current.onDraftChange?.('');
    }, []);

    const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const enterToSend = useRef(
      props.onSend ? createEnterToSendExtension(handleSend) : null
    );

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          hardBreak: false,
        }),
        Link.configure({ openOnClick: false, autolink: true }),
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

        if (propsRef.current.onDraftChange) {
          if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
          draftTimerRef.current = setTimeout(() => {
            const md = getEditorMarkdown(e);
            propsRef.current.onDraftChange?.(md);
          }, 400);
        }
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
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
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
    label: 'Blockquote',
    icon: <IconBlockquote size={ICON_SIZE} stroke={ICON_STROKE} />,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive('blockquote'),
  },
];

function Toolbar(props: ToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const activeStates = useEditorState({
    editor: props.editor,
    selector: (ctx) => {
      const e = ctx.editor;
      return toolbarButtons.map((btn) => btn.isActive?.(e) ?? false);
    },
  });

  const linkActive = props.editor.isActive('link');

  function handleLinkClick() {
    if (linkActive) {
      props.editor.chain().focus().unsetLink().run();
      return;
    }
    setLinkDialogOpen(true);
  }

  function handleLinkSubmit(url: string) {
    if (url) {
      props.editor.chain().focus().setLink({ href: url }).run();
    } else {
      props.editor.chain().focus().run();
    }
    setLinkDialogOpen(false);
  }

  return (
    <>
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
        <Tooltip content="Link">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLinkClick}
            className={clsx(
              'cursor-pointer rounded-md p-1.5 transition-colors',
              linkActive
                ? 'bg-discord-active/60 text-discord-brand'
                : 'text-discord-muted hover:bg-discord-hover/50 hover:text-discord-text'
            )}
          >
            <IconLink size={ICON_SIZE} stroke={ICON_STROKE} />
          </button>
        </Tooltip>
      </div>
      <LinkDialog
        open={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false);
          props.editor.chain().focus().run();
        }}
        onSubmit={handleLinkSubmit}
      />
    </>
  );
}

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

function LinkDialog(props: LinkDialogProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.open) {
      setUrl('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [props.open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const withProtocol =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    props.onSubmit(withProtocol);
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} title="Insert Link" maxWidth="max-w-[400px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="select-none text-xs font-bold uppercase tracking-wide text-discord-muted">
            URL
          </label>
          <input
            ref={inputRef}
            className="w-full rounded-xl border border-discord-active bg-discord-input px-3 py-2.5 text-discord-text outline-none placeholder:text-discord-muted focus:ring-2 focus:ring-discord-brand"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <DialogFooter
          onCancel={props.onClose}
          submitLabel="Insert"
        />
      </form>
    </Dialog>
  );
}
