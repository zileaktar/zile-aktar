'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Slide-over / modal panelleri için erişilebilirlik davranışı:
 *  - Açıkken `Esc` tuşu kapatır.
 *  - Odak panel içine hapsedilir (`Tab` / `Shift+Tab` döngüsü).
 *  - Açılınca ilk odaklanabilir öğeye odaklanılır; kapanınca önceki öğeye döner.
 *  - Açıkken sayfa (body) kaydırması kilitlenir.
 *  - Kapalıyken panele `inert` verilir → arka planda Tab ile gezilemez
 *    (paneller DOM'da kalıp yalnızca ekran dışına kaydığından gereklidir).
 *
 * Dönen ref'i panel elemanına bağlayın ve `role="dialog"` + `aria-modal="true"`
 * + `aria-label` + `tabIndex={-1}` ekleyin.
 */
export function useDialog<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  // inert: kapalı panel arka planda klavyeyle erişilemesin.
  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (isOpen) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === panel)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  return ref;
}
