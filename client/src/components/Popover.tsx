import { ReactNode, useEffect, useRef, useState } from 'react';

type Align = 'start' | 'end';

export default function Popover({
  trigger,
  children,
  width = 140,
  align = 'end',
  contentClassName = '',
}: {
  trigger: (open: boolean, toggle: () => void, anchorRef: React.RefObject<HTMLButtonElement>) => ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
  align?: Align;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setPos(null); return; }
    function compute() {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const margin = 12;
      let left = align === 'end' ? r.right - width : r.left;
      if (left < 8) left = 8;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;
      let top: number;
      let maxHeight: number;
      if (below >= 200 || below >= above) {
        top = r.bottom + 4;
        maxHeight = Math.max(160, below);
      } else {
        maxHeight = Math.max(160, above);
        top = Math.max(margin, r.top - maxHeight - 4);
      }
      setPos({ top, left, maxHeight });
    }
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (
        anchorRef.current && !anchorRef.current.contains(e.target as Node) &&
        popRef.current && !popRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <>
      {trigger(open, () => setOpen(o => !o), anchorRef)}
      {open && pos && (
        <div
          ref={popRef}
          className={`fixed z-50 card shadow-pop overflow-y-auto bg-white ${contentClassName}`}
          style={{ top: pos.top, left: pos.left, width, maxHeight: pos.maxHeight }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}
