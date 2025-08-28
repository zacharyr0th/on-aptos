import { useEffect, useRef, useCallback } from "react";

export function useClickOutside(handler: () => void, enabled: boolean = true) {
  const ref = useRef<HTMLDivElement>(null);
  const savedHandler = useRef(handler);

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler
  // without us needing to pass it in effect deps array
  // and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        savedHandler.current();
      }
    };

    // Use capture phase to handle event before React's synthetic events
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [enabled]); // Only re-run if enabled changes

  return ref;
}
