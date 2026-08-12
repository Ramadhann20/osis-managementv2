"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const OverlayContext = createContext(null);

const EXIT_DURATION = 250;

function createOverlayId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function OverlayProvider({ children }) {
  const [overlays, setOverlays] = useState([]);

  const overlaysRef = useRef([]);
  const closeTimersRef = useRef(new Map());
  const animationFramesRef = useRef(new Map());
  const closeAllTimerRef = useRef(null);

  const isOpen = overlays.length > 0;

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  const openOverlay = useCallback(
    ({
      content,
      closeOnBackdrop = true,
      className = "",
    }) => {
      const id = createOverlayId();

      if (closeAllTimerRef.current) {
        window.clearTimeout(closeAllTimerRef.current);
        closeAllTimerRef.current = null;
      }

      setOverlays((current) => [
        ...current.filter((item) => item.isVisible),
        {
          id,
          content,
          closeOnBackdrop,
          className,
          isVisible: false,
        },
      ]);

      const firstFrame =
        window.requestAnimationFrame(() => {
          const secondFrame =
            window.requestAnimationFrame(() => {
              setOverlays((current) =>
                current.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        isVisible: true,
                      }
                    : item
                )
              );

              animationFramesRef.current.delete(id);
            });

          animationFramesRef.current.set(
            id,
            secondFrame
          );
        });

      animationFramesRef.current.set(
        id,
        firstFrame
      );

      return id;
    },
    []
  );

  const closeOverlay = useCallback(
    (overlayId) => {
      const targetId =
        overlayId ||
        overlaysRef.current[
          overlaysRef.current.length - 1
        ]?.id;

      if (!targetId) return;

      const existingTimer =
        closeTimersRef.current.get(targetId);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      setOverlays((current) =>
        current.map((item) =>
          item.id === targetId
            ? {
                ...item,
                isVisible: false,
              }
            : item
        )
      );

      const timer = window.setTimeout(() => {
        setOverlays((current) =>
          current.filter(
            (item) => item.id !== targetId
          )
        );

        closeTimersRef.current.delete(targetId);
      }, EXIT_DURATION);

      closeTimersRef.current.set(
        targetId,
        timer
      );
    },
    []
  );

  const closeAllOverlays = useCallback(() => {
    closeTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });

    closeTimersRef.current.clear();

    setOverlays((current) =>
      current.map((item) => ({
        ...item,
        isVisible: false,
      }))
    );

    if (closeAllTimerRef.current) {
      window.clearTimeout(
        closeAllTimerRef.current
      );
    }

    closeAllTimerRef.current =
      window.setTimeout(() => {
        setOverlays([]);
        closeAllTimerRef.current = null;
      }, EXIT_DURATION);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeOverlay();
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, closeOverlay]);

  useEffect(() => {
    return () => {
      closeTimersRef.current.forEach(
        (timer) => {
          window.clearTimeout(timer);
        }
      );

      animationFramesRef.current.forEach(
        (frame) => {
          window.cancelAnimationFrame(frame);
        }
      );

      if (closeAllTimerRef.current) {
        window.clearTimeout(
          closeAllTimerRef.current
        );
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      overlayCount: overlays.length,
      openOverlay,
      closeOverlay,
      closeAllOverlays,
    }),
    [
      isOpen,
      overlays.length,
      openOverlay,
      closeOverlay,
      closeAllOverlays,
    ]
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}

      {overlays.map((overlay, index) => {
        const isTopOverlay =
          index === overlays.length - 1;

        return (
          <div
            key={overlay.id}
            role="dialog"
            aria-modal={
              isTopOverlay ? "true" : undefined
            }
            aria-hidden={!isTopOverlay}
            style={{
              zIndex: 100 + index * 10,
            }}
            className={`fixed inset-0 flex h-[100dvh] w-screen items-center justify-center overflow-hidden p-4 sm:p-6 ${
              isTopOverlay
                ? "pointer-events-auto"
                : "pointer-events-none"
            } ${overlay.className || ""}`}
          >
            <button
              type="button"
              tabIndex={isTopOverlay ? 0 : -1}
              aria-label="Close overlay"
              onClick={
                overlay.closeOnBackdrop
                  ? () =>
                      closeOverlay(overlay.id)
                  : undefined
              }
              className={`absolute inset-0 h-full w-full cursor-default bg-on-surface/40 transition-[opacity,backdrop-filter] duration-300 ease-out ${
                overlay.isVisible
                  ? "opacity-100 backdrop-blur-md"
                  : "opacity-0 backdrop-blur-none"
              }`}
            />

            <div
              className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full items-center justify-center overflow-hidden transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:max-h-[calc(100dvh-3rem)] ${
                overlay.isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-5 scale-[0.97] opacity-0"
              }`}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {overlay.content}
            </div>
          </div>
        );
      })}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);

  if (!context) {
    throw new Error(
      "useOverlay must be used inside OverlayProvider."
    );
  }

  return context;
}