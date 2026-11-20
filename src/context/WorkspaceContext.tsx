import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

export type ExperienceState =
  | 'ENTRANCE'
  | 'EXPLORING'
  | 'APPROACHING_DESK'
  | 'SEATED'
  | 'BOOTING'
  | 'DESKTOP';

export type AppId =
  | 'editorial'
  | 'about'
  | 'projects'
  | 'skills'
  | 'journey'
  | 'now'
  | 'terminal'
  | 'contact'
  | 'browser'
  | 'explorer'
  | 'music'
  | 'notepad'
  | 'resume'
  | 'settings'
  | `project:${string}`;

export type WallpaperId = 'sonoma' | 'obsidian' | 'setup-dark' | 'setup-neon' | 'room-iso' | 'grid';
export type AccentId = 'violet' | 'cyan' | 'amber' | 'emerald';
export type SnapZone = 'none' | 'left' | 'right' | 'top';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OSWindowState extends WindowBounds {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snapZone: SnapZone;
  restoreBounds?: WindowBounds;
  zIndex: number;
}

export const ACCENT_COLORS: Record<AccentId, { hex: string; label: string }> = {
  violet: { hex: '#8B5CF6', label: 'Electric Violet' },
  cyan: { hex: '#38BDF8', label: 'Ice Cyan' },
  amber: { hex: '#F59E0B', label: 'Amber Gold' },
  emerald: { hex: '#2DD4BF', label: 'Teal Pulse' },
};

const APP_TITLES: Record<string, { title: string; w: number; h: number }> = {
  editorial: { title: 'AHJ Studio — Editorial Portfolio', w: 980, h: 620 },
  about: { title: 'About Me', w: 680, h: 520 },
  projects: { title: 'Projects', w: 820, h: 560 },
  skills: { title: 'Skills', w: 740, h: 520 },
  journey: { title: '3D Journey', w: 860, h: 560 },
  now: { title: 'Now Building', w: 700, h: 520 },
  terminal: { title: 'Terminal — jashed@workspace', w: 720, h: 460 },
  contact: { title: 'Messages & Contact', w: 660, h: 510 },
  browser: { title: 'Safari — JashedNet', w: 840, h: 560 },
  explorer: { title: 'Finder', w: 740, h: 500 },
  music: { title: 'Apple Music · Liquid Morph', w: 540, h: 540 },
  notepad: { title: 'Notes', w: 620, h: 460 },
  resume: { title: 'Preview — Resume.pdf', w: 720, h: 560 },
  settings: { title: 'System Settings', w: 640, h: 520 },
};

interface WorkspaceContextValue {
  experienceState: ExperienceState;
  setExperienceState: React.Dispatch<React.SetStateAction<ExperienceState>>;
  enterRoom: () => void;
  sitAtDesk: () => void;
  completeApproachingDesk: () => void;
  powerOnPC: () => void;
  skipToDesktop: (initialApp?: AppId) => void;
  exitToRoom: () => void;
  reducedMotion: boolean;
  setReducedMotion: React.Dispatch<React.SetStateAction<boolean>>;
  windows: OSWindowState[];
  activeWindowId: AppId | null;
  snapPreview: SnapZone;
  setSnapPreview: React.Dispatch<React.SetStateAction<SnapZone>>;
  openApp: (id: AppId, customTitle?: string) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  minimizeAll: () => void;
  toggleMaximizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  updateWindowBounds: (id: AppId, patch: Partial<OSWindowState>) => void;
  snapWindow: (id: AppId, zone: SnapZone) => void;
  unsnapWindow: (id: AppId, pointerX: number, pointerY: number) => WindowBounds | null;
  wallpaper: WallpaperId;
  setWallpaper: (w: WallpaperId) => void;
  accent: AccentId;
  setAccent: (a: AccentId) => void;
  showVirtualKeyboard: boolean;
  setShowVirtualKeyboard: React.Dispatch<React.SetStateAction<boolean>>;
  lastTypedKey: { key: string; ts: number } | null;
  triggerVirtualKey: (key: string) => void;
  audioState: ReturnType<typeof soundEngine.getState>;
  notification: string | null;
  notify: (msg: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [experienceState, setExperienceState] = useState<ExperienceState>('ENTRANCE');
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [windows, setWindows] = useState<OSWindowState[]>([]);
  const [topZ, setTopZ] = useState<number>(20);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapZone>('none');

  const [wallpaper, setWallpaper] = useState<WallpaperId>('sonoma');
  const [accent, setAccent] = useState<AccentId>('violet');
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  const [lastTypedKey, setLastTypedKey] = useState<{ key: string; ts: number } | null>(null);
  const [audioState, setAudioState] = useState(() => soundEngine.getState());
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    return soundEngine.subscribe(() => {
      setAudioState(soundEngine.getState());
    });
  }, []);

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    window.setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const openApp = useCallback((id: AppId, customTitle?: string) => {
    soundEngine.playWindowOpen();
    setTopZ((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) => {
        const existing = prev.find((w) => w.id === id);
        if (existing) {
          return prev.map((w) =>
            w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ } : w
          );
        }
        const isProject = id.startsWith('project:');
        const meta = isProject
          ? { title: customTitle || 'Project Details', w: 780, h: 550 }
          : APP_TITLES[id] || { title: customTitle || id, w: 680, h: 500 };

        const openCount = prev.filter((w) => w.isOpen).length;
        const offset = (openCount % 5) * 28;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const safeW = Math.min(meta.w, Math.max(320, vw - 120));
        const safeH = Math.min(meta.h, Math.max(320, vh - 128));
        const startX = Math.max(24, Math.min(96 + offset, vw - safeW - 24));
        const startY = Math.max(44, Math.min(54 + offset, vh - safeH - 84));

        return [
          ...prev,
          {
            id,
            title: customTitle || meta.title,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            snapZone: 'none',
            zIndex: nextZ,
            x: startX,
            y: startY,
            width: safeW,
            height: safeH,
          },
        ];
      });
      setActiveWindowId(id);
      return nextZ;
    });
  }, []);

  const enterRoom = useCallback(() => {
    soundEngine.playTransitionSwoosh();
    setExperienceState('EXPLORING');
  }, []);

  const sitAtDesk = useCallback(() => {
    soundEngine.playTransitionSwoosh();
    setExperienceState('APPROACHING_DESK');
  }, []);

  const completeApproachingDesk = useCallback(() => {
    setExperienceState((curr) => (curr === 'APPROACHING_DESK' ? 'SEATED' : curr));
  }, []);

  const powerOnPC = useCallback(() => {
    soundEngine.playStartupChime();
    setExperienceState('BOOTING');
  }, []);

  const skipToDesktop = useCallback(
    (initialApp?: AppId) => {
      soundEngine.playTransitionSwoosh();
      setExperienceState('DESKTOP');
      if (initialApp) {
        openApp(initialApp);
      } else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        openApp('editorial');
      }
      notify('Welcome to JashedOS — drag any window titlebar to an edge to snap.');
    },
    [openApp, notify]
  );

  const exitToRoom = useCallback(() => {
    soundEngine.playTransitionSwoosh();
    setExperienceState('EXPLORING');
  }, []);

  const closeApp = useCallback((id: AppId) => {
    soundEngine.playWindowClose();
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((curr) => (curr === id ? null : curr));
  }, []);

  const minimizeApp = useCallback((id: AppId) => {
    soundEngine.playMouseClick();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((curr) => (curr === id ? null : curr));
  }, []);

  const minimizeAll = useCallback(() => {
    soundEngine.playMouseClick();
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    setActiveWindowId(null);
  }, []);

  const toggleMaximizeApp = useCallback((id: AppId) => {
    soundEngine.playMouseClick();
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized || w.snapZone !== 'none') {
          const restored = w.restoreBounds || { x: 80, y: 56, width: 720, height: 520 };
          return {
            ...w,
            ...restored,
            isMaximized: false,
            snapZone: 'none',
            restoreBounds: undefined,
          };
        }
        return {
          ...w,
          isMaximized: true,
          snapZone: 'top',
          restoreBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      })
    );
  }, []);

  const focusApp = useCallback((id: AppId) => {
    setTopZ((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w
        )
      );
      setActiveWindowId(id);
      return nextZ;
    });
  }, []);

  const updateWindowBounds = useCallback((id: AppId, patch: Partial<OSWindowState>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const snapWindow = useCallback((id: AppId, zone: SnapZone) => {
    if (zone === 'none') return;
    soundEngine.playMouseClick();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const topOffset = 40; // Top status bar height
    const bottomDock = 68; // Bottom dock height
    const usableH = Math.max(320, vh - topOffset - bottomDock);

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const restoreBounds =
          w.restoreBounds || { x: w.x, y: w.y, width: w.width, height: w.height };

        if (zone === 'left') {
          return {
            ...w,
            restoreBounds,
            snapZone: 'left',
            isMaximized: false,
            x: 8,
            y: topOffset + 6,
            width: Math.floor(vw / 2) - 12,
            height: usableH - 8,
          };
        }
        if (zone === 'right') {
          return {
            ...w,
            restoreBounds,
            snapZone: 'right',
            isMaximized: false,
            x: Math.floor(vw / 2) + 4,
            y: topOffset + 6,
            width: Math.floor(vw / 2) - 12,
            height: usableH - 8,
          };
        }
        // top -> maximize
        return {
          ...w,
          restoreBounds,
          snapZone: 'top',
          isMaximized: true,
          x: 8,
          y: topOffset + 6,
          width: vw - 16,
          height: usableH - 8,
        };
      })
    );
  }, []);

  const unsnapWindow = useCallback(
    (id: AppId, pointerX: number, pointerY: number): WindowBounds | null => {
      let result: WindowBounds | null = null;
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          if (w.snapZone === 'none' && !w.isMaximized) return w;
          const restored = w.restoreBounds || { x: 80, y: 60, width: 700, height: 500 };
          const nextX = Math.max(
            8,
            Math.min(window.innerWidth - restored.width - 8, pointerX - restored.width / 2)
          );
          const nextY = Math.max(44, Math.min(window.innerHeight - 160, pointerY - 20));
          result = { x: nextX, y: nextY, width: restored.width, height: restored.height };
          return {
            ...w,
            ...result,
            snapZone: 'none',
            isMaximized: false,
            restoreBounds: undefined,
          };
        })
      );
      return result;
    },
    []
  );

  const triggerVirtualKey = useCallback((key: string) => {
    const isSpecial = key.length > 1;
    soundEngine.playKeyClick(isSpecial);
    setLastTypedKey({ key, ts: Date.now() });
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        experienceState,
        setExperienceState,
        enterRoom,
        sitAtDesk,
        completeApproachingDesk,
        powerOnPC,
        skipToDesktop,
        exitToRoom,
        reducedMotion,
        setReducedMotion,
        windows,
        activeWindowId,
        snapPreview,
        setSnapPreview,
        openApp,
        closeApp,
        minimizeApp,
        minimizeAll,
        toggleMaximizeApp,
        focusApp,
        updateWindowBounds,
        snapWindow,
        unsnapWindow,
        wallpaper,
        setWallpaper,
        accent,
        setAccent,
        showVirtualKeyboard,
        setShowVirtualKeyboard,
        lastTypedKey,
        triggerVirtualKey,
        audioState,
        notification,
        notify,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
