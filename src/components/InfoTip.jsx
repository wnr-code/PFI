import React, { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

export function InfoTip({ title, children, label = 'Informasi' }) {
  const [open, setOpen] = useState(false);
  const host = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!host.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <span className="info-tip" ref={host}>
    <button type="button" className="info-tip-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Info size={13}/></button>
    {open && <span className="info-tip-card" role="dialog" aria-label={title}><button type="button" aria-label="Tutup" onClick={() => setOpen(false)}><X size={13}/></button><b>{title}</b><span>{children}</span></span>}
  </span>;
}
