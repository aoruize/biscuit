import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h1(props) {
    return <h1 className="mb-1 mt-2 text-xl font-bold text-discord-text" {...props} />;
  },
  h2(props) {
    return <h2 className="mb-1 mt-2 text-lg font-bold text-discord-text" {...props} />;
  },
  h3(props) {
    return <h3 className="mb-0.5 mt-1.5 text-base font-semibold text-discord-text" {...props} />;
  },
  p(props) {
    return <p className="my-0.5 leading-[1.5rem]" {...props} />;
  },
  a(props) {
    return (
      <a
        className="text-discord-link transition-colors hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  strong(props) {
    return <strong className="font-bold" {...props} />;
  },
  em(props) {
    return <em className="italic" {...props} />;
  },
  del(props) {
    return <del className="line-through" {...props} />;
  },
  blockquote(props) {
    return (
      <blockquote
        className="my-1 border-l-[3px] border-discord-muted/50 pl-3 text-discord-muted"
        {...props}
      />
    );
  },
  ul(props) {
    const isTaskList = Array.isArray(props.children) &&
      props.children.some(
        (child) =>
          child != null &&
          typeof child === 'object' &&
          'props' in child &&
          child.props?.className === 'task-list-item'
      );
    if (isTaskList) {
      return <ul className="my-1 list-none space-y-0.5 pl-0" {...props} />;
    }
    return <ul className="my-1 list-disc space-y-0.5 pl-6" {...props} />;
  },
  ol(props) {
    return <ol className="my-1 list-decimal space-y-0.5 pl-6" {...props} />;
  },
  li(props) {
    const isTask = props.className === 'task-list-item';
    if (isTask) {
      return <li className="flex items-start gap-1.5 list-none" {...props} />;
    }
    return <li {...props} />;
  },
  input(props) {
    if (props.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={props.checked}
          readOnly
          className="mt-1 h-3.5 w-3.5 shrink-0 cursor-default accent-discord-brand"
        />
      );
    }
    return <input {...props} />;
  },
  code(props) {
    const { children, className } = props;
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code className="text-[13px]">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-discord-sidebar/80 px-1.5 py-0.5 text-[13px] text-discord-brand">
        {children}
      </code>
    );
  },
  pre(props) {
    return (
      <pre className="my-1.5 overflow-x-auto rounded-lg bg-discord-darker/80 p-3 text-discord-text">
        {props.children}
      </pre>
    );
  },
  hr() {
    return <hr className="my-2 border-discord-active/60" />;
  },
};

const remarkPlugins = [remarkGfm];

export const MarkdownRenderer = memo(function MarkdownRenderer(props: MarkdownRendererProps) {
  if (!props.content) return null;

  return (
    <div className="markdown-body text-[15px] leading-[1.5rem] text-discord-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {props.content}
      </ReactMarkdown>
    </div>
  );
});
