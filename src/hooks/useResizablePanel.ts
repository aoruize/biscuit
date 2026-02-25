import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

interface UseResizablePanelReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export function useResizablePanel(options: UseResizablePanelOptions): UseResizablePanelReturn {
  const [width, setWidth] = useState(options.defaultWidth);
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

    function handleMouseMove(e: MouseEvent) {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(options.maxWidth, Math.max(options.minWidth, startWidthRef.current + delta));
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
  }, [isDragging, options.minWidth, options.maxWidth]);

  return { width, isDragging, handleMouseDown };
}
