import { useEffect, useRef } from 'react';

/** Calls onOutside when a pointer-down or Escape happens outside the returned ref's element. */
const useClickOutside = (onOutside, active = true) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    const onKey = (e) => e.key === 'Escape' && onOutside();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onOutside, active]);
  return ref;
};

export default useClickOutside;
