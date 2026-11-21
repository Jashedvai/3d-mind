import React, { useRef } from 'react';
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  X,
} from 'lucide-react';
import {
  OSWindowState,
  useWorkspace,
} from '../../context/WorkspaceContext';
import { detectSnapZone } from './WindowManager/WindowManager';

interface WindowFrameProps {
  win: OSWindowState;
  children: React.ReactNode;
}

export function WindowFrame({ win, children }: WindowFrameProps) {
  const {
    activeWindowId,
    focusApp,
    closeApp,
    minimizeApp,
    toggleMaximizeApp,
    updateWindowBounds,
    snapWindow,
    unsnapWindow,
    setSnapPreview,
  } = useWorkspace();

  const dragOrigin = useRef<{
    startX: number;
    startY: number;
    winX: number;
    winY: number;
    winW: number;
    unsnapped: boolean;
  } | null>(null);

  if (!win.isOpen || win.isMinimized) return null;

  const isFocused = activeWindowId === win.id;
  const isDesktopViewport = typeof window !== 'undefined' && window.innerWidth >= 768;

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    focusApp(win.id);

    dragOrigin.current = {
      startX: e.clientX,
      startY: e.clientY,
      winX: win.x,
      winY: win.y,
      winW: win.width,
      unsnapped: win.snapZone === 'none' && !win.isMaximized,
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragOrigin.current) return;

      const moveDist = Math.hypot(
        moveEvent.clientX - dragOrigin.current.startX,
        moveEvent.clientY - dragOrigin.current.startY
      );

      if (!dragOrigin.current.unsnapped && moveDist > 8) {
        const restored = unsnapWindow(win.id, moveEvent.clientX, moveEvent.clientY);
        if (restored) {
          dragOrigin.current = {
            startX: moveEvent.clientX,
            startY: moveEvent.clientY,
            winX: restored.x,
            winY: restored.y,
            winW: restored.width,
            unsnapped: true,
          };
        } else {
          dragOrigin.current.unsnapped = true;
        }
      }

      if (dragOrigin.current.unsnapped) {
        const dx = moveEvent.clientX - dragOrigin.current.startX;
        const dy = moveEvent.clientY - dragOrigin.current.startY;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nextX = Math.max(
          -dragOrigin.current.winW + 140,
          Math.min(vw - 140, dragOrigin.current.winX + dx)
        );
        const nextY = Math.max(36, Math.min(vh - 116, dragOrigin.current.winY + dy));
        updateWindowBounds(win.id, { x: nextX, y: nextY });

        const zone = detectSnapZone(moveEvent.clientX, moveEvent.clientY);
        setSnapPreview(zone);
      }
    };

    const onUp = (upEvent: PointerEvent) => {
      if (dragOrigin.current?.unsnapped) {
        const zone = detectSnapZone(upEvent.clientX, upEvent.clientY);
        if (zone !== 'none') {
          snapWindow(win.id, zone);
        }
      }
      dragOrigin.current = null;
      setSnapPreview('none');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  let desktopStyle: React.CSSProperties;
  if (win.isMaximized || win.snapZone === 'top') {
    desktopStyle = {
      left: 8,
      top: 38,
      width: 'calc(100vw - 16px)',
      height: 'calc(100dvh - 122px)',
      zIndex: win.zIndex,
    };
  } else if (win.snapZone === 'left') {
    desktopStyle = {
      left: 8,
      top: 38,
      width: 'calc(50vw - 12px)',
      height: 'calc(100dvh - 122px)',
      zIndex: win.zIndex,
    };
  } else if (win.snapZone === 'right') {
    desktopStyle = {
      left: 'calc(50vw + 4px)',
      top: 38,
      width: 'calc(50vw - 12px)',
      height: 'calc(100dvh - 122px)',
      zIndex: win.zIndex,
    };
  } else {
    desktopStyle = {
      left: `${win.x}px`,
      top: `${Math.max(38, win.y)}px`,
      width: `min(${win.width}px, calc(100vw - 24px))`,
      height: `min(${win.height}px, calc(100dvh - 128px))`,
      zIndex: win.zIndex,
    };
  }

  return (
    <section
      onPointerDown={() => focusApp(win.id)}
      style={isDesktopViewport ? desktopStyle : { zIndex: win.zIndex }}
      className={`fixed md:absolute inset-0 md:inset-auto md:rounded-[22px] bg-[#0F1322]/50 backdrop-blur-3xl backdrop-saturate-150 flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-200 ${
        isFocused
          ? 'md:border md:border-white/[0.28] md:liquid-glass'
          : 'md:border md:border-white/[0.13] md:shadow-[inset_1px_1px_0_rgba(255,255,255,0.14),0_18px_46px_rgba(0,0,0,0.48)]'
      }`}
      aria-label={win.title}
    >
      {/* Desktop macOS Titlebar with Traffic Lights */}
      <div
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={() => toggleMaximizeApp(win.id)}
        className={`hidden md:flex h-11 px-4 border-b items-center justify-between gap-3 select-none cursor-grab active:cursor-grabbing shrink-0 touch-none transition-colors ${
          isFocused
            ? 'bg-white/[0.08] border-white/[0.13]'
            : 'bg-white/[0.03] border-white/[0.08]'
        }`}
      >
        {/* Apple Traffic Light Buttons */}
        <div className="group/lights flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => closeApp(win.id)}
            className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-black/75 transition-all duration-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-90 ${
              isFocused
                ? 'bg-[#FF5F57] border-black/20'
                : 'bg-white/20 border-white/15 group-hover/lights:bg-[#FF5F57] group-hover/lights:border-black/20'
            }`}
            aria-label={`Close ${win.title}`}
            title="Close"
          >
            <X className="w-2.5 h-2.5 opacity-0 group-hover/lights:opacity-100 transition-opacity duration-150" />
          </button>
          <button
            type="button"
            onClick={() => minimizeApp(win.id)}
            className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-black/75 transition-all duration-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-90 ${
              isFocused
                ? 'bg-[#FEBC2E] border-black/20'
                : 'bg-white/20 border-white/15 group-hover/lights:bg-[#FEBC2E] group-hover/lights:border-black/20'
            }`}
            aria-label={`Minimize ${win.title}`}
            title="Minimize"
          >
            <Minus className="w-2.5 h-2.5 opacity-0 group-hover/lights:opacity-100 transition-opacity duration-150" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeApp(win.id)}
            className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-black/75 transition-all duration-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-90 ${
              isFocused
                ? 'bg-[#28C840] border-black/20'
                : 'bg-white/20 border-white/15 group-hover/lights:bg-[#28C840] group-hover/lights:border-black/20'
            }`}
            aria-label={win.isMaximized ? `Restore ${win.title}` : `Zoom ${win.title}`}
            title={win.isMaximized ? 'Restore' : 'Maximize'}
          >
            {win.isMaximized || win.snapZone !== 'none' ? (
              <Minimize2 className="w-2 h-2 opacity-0 group-hover/lights:opacity-100 transition-opacity duration-150" />
            ) : (
              <Plus className="w-2.5 h-2.5 opacity-0 group-hover/lights:opacity-100 transition-opacity duration-150" />
            )}
          </button>
        </div>

        {/* Centered macOS Window Title */}
        <div className="flex-1 text-center min-w-0">
          <span
            className={`text-xs font-medium tracking-tight truncate block transition-colors ${
              isFocused ? 'text-white/95' : 'text-white/55'
            }`}
          >
            {win.title}
          </span>
        </div>

        {/* Tile / Snap Segmented Controls */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.06] border border-white/[0.09] shrink-0">
          <button
            type="button"
            onClick={() => snapWindow(win.id, 'left')}
            className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${
              win.snapZone === 'left'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/55 hover:text-white hover:bg-white/[0.09]'
            }`}
            aria-label={`Tile ${win.title} left`}
            title="Tile Window Left"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => snapWindow(win.id, 'right')}
            className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${
              win.snapZone === 'right'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/55 hover:text-white hover:bg-white/[0.09]'
            }`}
            aria-label={`Tile ${win.title} right`}
            title="Tile Window Right"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeApp(win.id)}
            className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${
              win.isMaximized || win.snapZone === 'top'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/55 hover:text-white hover:bg-white/[0.09]'
            }`}
            aria-label={`Zoom ${win.title}`}
            title="Full Window"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile iOS Navigation Header */}
      <div className="flex md:hidden h-12 px-3 pt-1 bg-[#141826]/60 backdrop-blur-3xl backdrop-saturate-150 border-b border-white/[0.14] items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => minimizeApp(win.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] px-2.5 py-1 rounded-full hover:bg-white/[0.08] whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <span className="text-xs font-semibold text-white truncate max-w-[50%]">
          {win.title}
        </span>

        <button
          type="button"
          onClick={() => closeApp(win.id)}
          className="text-xs font-medium text-rose-400 px-2.5 py-1 rounded-full hover:bg-rose-500/15 whitespace-nowrap shrink-0"
        >
          Close
        </button>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0D18]/36">{children}</div>

      {/* Mobile iOS Home Indicator Bar */}
      <div className="md:hidden h-6 bg-[#0E1220]/60 backdrop-blur-3xl backdrop-saturate-150 border-t border-white/[0.1] flex items-center justify-center shrink-0">
        <button
          type="button"
          onClick={() => minimizeApp(win.id)}
          aria-label="Return to iOS Home Screen"
          className="w-32 h-1.5 rounded-full bg-white/45 active:bg-white/80 transition-colors"
        />
      </div>
    </section>
  );
}
