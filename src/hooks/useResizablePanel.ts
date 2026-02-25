import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number | (() => number);
  persistKey?: string;
  direction?: 'right' | 'left';
}

interface UseResizablePanelReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

function resolveMax(maxWidth: number | (() => number)): number {
  return typeof maxWidth === 'function' ? maxWidth() : maxWidth;
}

function loadPersistedWidth(key: string, fallback: number, min: number, max: number): number {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) return Math.min(max, Math.max(min, parsed));
    }
  } catch { /* noop */ }
  return fallback;
}

export function useResizablePanel(options: UseResizablePanelOptions): UseResizablePanelReturn {
  const { defaultWidth, minWidth, maxWidth, persistKey, direction = 'right' } = options;
  const maxWidthRef = useRef(maxWidth);
  maxWidthRef.current = maxWidth;

  const [width, setWidth] = useState(() =>
    persistKey ? loadPersistedWidth(persistKey, defaultWidth, minWidth, resolveMax(maxWidth)) : defaultWidth
  );
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsDragging(true);
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const sign = direction === 'right' ? 1 : -1;

    function handleMouseMove(e: MouseEvent) {
      const currentMax = resolveMax(maxWidthRef.current);
      const delta = (e.clientX - startXRef.current) * sign;
      const newWidth = Math.min(currentMax, Math.max(minWidth, startWidthRef.current + delta));
      setWidth(newWidth);
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, direction]);

  useEffect(() => {
    if (persistKey && !isDragging) {
      localStorage.setItem(persistKey, String(Math.round(width)));
    }
  }, [width, isDragging, persistKey]);

  return { width, isDragging, handleMouseDown };
}
