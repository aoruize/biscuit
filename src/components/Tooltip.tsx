import { useState, cloneElement } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  arrow,
  useFloating,
  useHover,
  useInteractions,
  useRole,
  useDismiss,
  type Placement,
} from '@floating-ui/react';
import { useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement<Record<string, unknown>>;
  placement?: Placement;
  delay?: number;
}

export function Tooltip(props: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context, middlewareData, placement } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    placement: props.placement ?? 'top',
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { delay: { open: props.delay ?? 400, close: 0 } });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss, role]);

  const side = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const arrowSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side] as string;

  return (
    <>
      {cloneElement(props.children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[10000] pointer-events-none"
          >
            <div className="rounded-lg bg-discord-darker/95 px-2.5 py-1.5 text-xs font-medium text-discord-text shadow-lg">
              {props.content}
              <div
                ref={arrowRef}
                className="absolute h-2 w-2 rotate-45 bg-discord-darker/95"
                style={{
                  left: middlewareData.arrow?.x != null ? middlewareData.arrow.x : undefined,
                  top: middlewareData.arrow?.y != null ? middlewareData.arrow.y : undefined,
                  [arrowSide]: -4,
                }}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
