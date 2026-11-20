import React, { useEffect, useId, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

export function InfoTip({ title, children, label = 'Informasi', closeLabel = 'Tutup informasi' }) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef(null);
  const dragDistance = useRef(0);
  const host = useRef(null);
  const trigger = useRef(null);
  const titleId = useId();
  const close = (restoreFocus = false) => {
    if (restoreFocus) trigger.current?.focus();
    setOpen(false);
  };
  const startDrag = (event) => { dragStart.current = event.touches[0].clientY; dragDistance.current = 0; setDragY(0); };
  const moveDrag = (event) => { if (dragStart.current === null) return; dragDistance.current = Math.max(0, event.touches[0].clientY - dragStart.current); setDragY(dragDistance.current); };
  const endDrag = () => { if (dragDistance.current > 70) close(true); dragStart.current = null; dragDistance.current = 0; setDragY(0); };
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!host.current?.contains(event.target)) close(false); };
    const escape = (event) => { if (event.key === 'Escape') close(true); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <span className="info-tip" ref={host}>
    <button ref={trigger} type="button" className="info-tip-trigger" aria-label={label} aria-expanded={open} aria-controls={open ? titleId : undefined} onClick={() => setOpen((value) => !value)}><Info size={13}/></button>
    {open && <span id={titleId} className="info-tip-card" role="dialog" aria-labelledby={`${titleId}-title`} style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}><i className="info-tip-drag-handle" aria-hidden="true" onTouchStart={startDrag} onTouchMove={moveDrag} onTouchEnd={endDrag}/><button type="button" aria-label={closeLabel} onClick={() => close(true)}><X size={13}/></button><b id={`${titleId}-title`}>{title}</b><span>{children}</span></span>}
  </span>;
}
