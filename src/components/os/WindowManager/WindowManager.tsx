import React, { useEffect } from 'react';
import { AppId, SnapZone, useWorkspace } from '../../../context/WorkspaceContext';
import { WindowFrame } from '../WindowFrame';

export function detectSnapZone(clientX: number, clientY: number): SnapZone {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const leftThreshold = Math.max(24, vw * 0.05);
  const rightThreshold = Math.min(vw - 24, vw * 0.95);
  const topThreshold = Math.max(44, vh * 0.05);

  if (clientX <= leftThreshold) return 'left';
  if (clientX >= rightThreshold) return 'right';
  if (clientY <= topThreshold) return 'top';
  return 'none';
}

interface WindowManagerProps {
  renderAppContent: (id: AppId) => React.ReactNode;
}

/**
 * Orchestrates active OS windows, edge drag-to-snap preview regions,
 * and keyboard window tiling shortcuts (Alt + Arrow keys).
 */
export function WindowManager({ renderAppContent }: WindowManagerProps) {
  const { windows, activeWindowId, snapPreview, snapWindow, toggleMaximizeApp } = useWorkspace();
  const openWindows = windows.filter((w) => w.isOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || !activeWindowId) return;
      const win = windows.find((w) => w.id === activeWindowId && w.isOpen && !w.isMinimized);
      if (!win) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        snapWindow(win.id, 'left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        snapWindow(win.id, 'right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        snapWindow(win.id, 'top');
      } else if (e.key === 'ArrowDown' && (win.isMaximized || win.snapZone !== 'none')) {
        e.preventDefault();
        toggleMaximizeApp(win.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeWindowId, windows, snapWindow, toggleMaximizeApp]);

  return (
    <>
      {/* Drag-to-Snap Preview Overlay (Left, Right, or Fullscreen Top Edge) */}
      {snapPreview !== 'none' && (
        <div
          aria-hidden="true"
          className={`hidden md:block fixed z-[85] rounded-2xl border border-white/30 bg-white/[0.1] backdrop-blur-xl transition-all duration-150 pointer-events-none ${
            snapPreview === 'left'
              ? 'left-2 top-10 bottom-[84px] w-[calc(50vw-12px)]'
              : snapPreview === 'right'
                ? 'right-2 top-10 bottom-[84px] w-[calc(50vw-12px)]'
                : 'inset-x-2 top-10 bottom-[84px]'
          }`}
        />
      )}

      {/* Active Desktop & Mobile Sheet Windows */}
      {openWindows.map((win) => (
        <WindowFrame key={win.id} win={win}>
          {renderAppContent(win.id)}
        </WindowFrame>
      ))}
    </>
  );
}
