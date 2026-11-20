import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BatteryCharging,
  Compass,
  Facebook,
  FileText,
  Folder,
  Github,
  Globe,
  Headphones,
  Instagram,
  Keyboard,
  Layers,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Monitor,
  Music,
  Pause,
  Phone,
  Play,
  Rocket,
  Search,
  Settings,
  SlidersHorizontal,
  Terminal as TerminalIcon,
  User,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react';
import { ACCENT_COLORS, AppId, useWorkspace } from '../../context/WorkspaceContext';
import { NOW_BUILDING, PROFILE, PROJECTS } from '../../data/portfolioData';
import { soundEngine } from '../../audio/soundEngine';
import { WindowFrame } from './WindowFrame';
import { VirtualKeyboard } from './VirtualKeyboard';
import { EditorialApp } from './apps/EditorialApp';
import { AboutApp } from './apps/AboutApp';
import { ProjectsApp } from './apps/ProjectsApp';
import { ProjectDetailApp } from './apps/ProjectDetailApp';
import { SkillsApp } from './apps/SkillsApp';
import { JourneyApp } from './apps/JourneyApp';
import { NowBuildingApp } from './apps/NowBuildingApp';
import { TerminalApp } from './apps/TerminalApp';
import { ContactApp } from './apps/ContactApp';
import { BrowserApp } from './apps/BrowserApp';
import { ExplorerApp } from './apps/ExplorerApp';
import { MusicApp } from './apps/MusicApp';
import { NotepadApp } from './apps/NotepadApp';
import { ResumeApp } from './apps/ResumeApp';
import { SettingsApp } from './apps/SettingsApp';

interface AppIconMeta {
  id: AppId;
  label: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESKTOP_APPS: AppIconMeta[] = [
  { id: 'editorial', label: 'AHJ Studio', gradient: 'from-slate-600 via-zinc-800 to-black', icon: Globe },
  { id: 'about', label: 'About Me', gradient: 'from-sky-400 to-blue-600', icon: User },
  { id: 'projects', label: 'Projects', gradient: 'from-violet-500 to-indigo-600', icon: Layers },
  { id: 'journey', label: '3D Journey', gradient: 'from-cyan-400 to-teal-600', icon: Compass },
  { id: 'now', label: 'Now Building', gradient: 'from-fuchsia-500 to-purple-600', icon: Rocket },
  { id: 'skills', label: 'Skills', gradient: 'from-amber-400 to-orange-600', icon: SlidersHorizontal },
  { id: 'terminal', label: 'Terminal', gradient: 'from-zinc-700 to-zinc-900', icon: TerminalIcon },
  { id: 'contact', label: 'Messages', gradient: 'from-emerald-400 to-green-600', icon: MessageSquare },
  { id: 'music', label: 'Music', gradient: 'from-rose-500 to-pink-600', icon: Music },
  { id: 'browser', label: 'Safari', gradient: 'from-blue-400 to-cyan-600', icon: Monitor },
  { id: 'explorer', label: 'Finder', gradient: 'from-sky-300 to-blue-500', icon: Folder },
  { id: 'notepad', label: 'Notes', gradient: 'from-yellow-400 to-amber-500', icon: FileText },
  { id: 'resume', label: 'Preview', gradient: 'from-indigo-400 to-blue-700', icon: FileText },
  { id: 'settings', label: 'Settings', gradient: 'from-slate-500 to-slate-700', icon: Settings },
];

const MAC_DOCK_PINNED: AppId[] = [
  'editorial',
  'explorer',
  'projects',
  'journey',
  'about',
  'terminal',
  'music',
  'contact',
  'settings',
];

const IOS_DOCK_PINNED: AppId[] = ['editorial', 'projects', 'journey', 'about'];

export function DesktopOS() {
  const {
    windows,
    activeWindowId,
    snapPreview,
    openApp,
    focusApp,
    minimizeApp,
    minimizeAll,
    snapWindow,
    exitToRoom,
    wallpaper,
    setWallpaper,
    accent,
    showVirtualKeyboard,
    setShowVirtualKeyboard,
    reducedMotion,
    setReducedMotion,
    audioState,
    notification,
  } = useWorkspace();

  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [startSearch, setStartSearch] = useState('');
  const [windowMenuOpen, setWindowMenuOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [macClock, setMacClock] = useState('');
  const [iosClock, setIosClock] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setMacClock(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
          '  ' +
          now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      );
      setIosClock(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    };
    updateClock();
    const id = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAppleMenuOpen(false);
        setStartMenuOpen(false);
        setWindowMenuOpen(false);
        setControlCenterOpen(false);
        setSpotlightOpen((open) => !open);
        setSpotlightQuery('');
      } else if (e.key === 'Escape') {
        setSpotlightOpen(false);
        setAppleMenuOpen(false);
        setStartMenuOpen(false);
        setWindowMenuOpen(false);
        setControlCenterOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const accentHex = ACCENT_COLORS[accent].hex;

  const spotlightResults = useMemo(() => {
    const q = spotlightQuery.trim().toLowerCase();
    const apps = DESKTOP_APPS.filter((a) => !q || a.label.toLowerCase().includes(q)).map((a) => ({
      id: a.id,
      title: a.label,
      subtitle: 'Application',
    }));
    const projs = PROJECTS.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q))
    ).map((p) => ({
      id: `project:${p.id}` as AppId,
      title: p.title,
      subtitle: `Project · ${p.statusLabel}`,
    }));
    return [...apps, ...projs].slice(0, 8);
  }, [spotlightQuery]);

  const renderAppContent = (id: AppId) => {
    if (id.startsWith('project:')) {
      return <ProjectDetailApp projectId={id.replace('project:', '')} />;
    }
    switch (id) {
      case 'editorial':
        return <EditorialApp />;
      case 'about':
        return <AboutApp />;
      case 'projects':
        return <ProjectsApp />;
      case 'skills':
        return <SkillsApp />;
      case 'journey':
        return <JourneyApp />;
      case 'now':
        return <NowBuildingApp />;
      case 'terminal':
        return <TerminalApp />;
      case 'contact':
        return <ContactApp />;
      case 'browser':
        return <BrowserApp />;
      case 'explorer':
        return <ExplorerApp />;
      case 'music':
        return <MusicApp />;
      case 'notepad':
        return <NotepadApp />;
      case 'resume':
        return <ResumeApp />;
      case 'settings':
        return <SettingsApp />;
      default:
        return <EditorialApp />;
    }
  };

  const closeAllMenus = () => {
    setAppleMenuOpen(false);
    setStartMenuOpen(false);
    setWindowMenuOpen(false);
    setControlCenterOpen(false);
  };

  const handleOpenApp = (id: AppId, customTitle?: string) => {
    closeAllMenus();
    setSpotlightOpen(false);
    openApp(id, customTitle);
  };

  const openWindows = windows.filter((w) => w.isOpen);
  const extraTaskbarWindows = openWindows.filter((w) => !MAC_DOCK_PINNED.includes(w.id));
  const activeWin = openWindows.find((w) => w.id === activeWindowId && !w.isMinimized);
  const startMenuApps = useMemo(() => {
    const q = startSearch.trim().toLowerCase();
    return DESKTOP_APPS.filter((a) => !q || a.label.toLowerCase().includes(q));
  }, [startSearch]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#070912] text-[#F4F5F7] select-none">
      {/* Apple macOS Sonoma / iOS Aurora Wallpaper Layer */}
      {wallpaper === 'sonoma' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 55% at 22% 18%, ${accentHex}44, transparent 60%),
              radial-gradient(ellipse 70% 50% at 82% 24%, rgba(56, 189, 248, 0.30), transparent 60%),
              radial-gradient(ellipse 90% 60% at 50% 88%, rgba(236, 72, 153, 0.22), transparent 62%),
              linear-gradient(155deg, #060916 0%, #12102b 48%, #071322 100%)
            `,
          }}
        />
      )}
      {wallpaper === 'setup-dark' && (
        <div className="absolute inset-0">
          <img
            src={PROFILE.setupPhotoDark}
            alt="PC setup wallpaper"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[#070912]/65" />
        </div>
      )}
      {wallpaper === 'setup-neon' && (
        <div className="absolute inset-0">
          <img
            src={PROFILE.setupPhotoNeon}
            alt="Ambient PC setup wallpaper"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[#070912]/65" />
        </div>
      )}
      {wallpaper === 'room-iso' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 75% 55% at 28% 30%, rgba(116, 110, 244, 0.36), transparent 62%),
              radial-gradient(ellipse 65% 50% at 80% 72%, rgba(56, 189, 248, 0.18), transparent 60%),
              linear-gradient(150deg, #07080F 0%, #101223 55%, #090B14 100%)
            `,
          }}
        />
      )}
      {wallpaper === 'obsidian' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px), radial-gradient(circle at 22% 28%, ${accentHex}24, transparent 48%)`,
            backgroundSize: '44px 44px, 44px 44px, 100% 100%',
          }}
        />
      )}
      {wallpaper === 'grid' && (
        <div
          className="absolute inset-0 bg-[#070912]"
          style={{
            backgroundImage: `radial-gradient(${accentHex}30 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* ==========================================
          DESKTOP TOP MACOS MENU BAR (>= md)
      ========================================== */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-[90] h-8 px-3.5 bg-[#0F1320]/48 backdrop-blur-3xl backdrop-saturate-150 border-b border-white/[0.14] shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)] items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {/* Apple-style Workspace Menu */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setWindowMenuOpen(false);
              setControlCenterOpen(false);
              setStartMenuOpen(false);
              setAppleMenuOpen((o) => !o);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-white transition-colors whitespace-nowrap shrink-0 ${
              appleMenuOpen ? 'bg-white/20' : 'hover:bg-white/12'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 15.2c0 1.4 1 2.3 2.4 2.3 1.5 0 2.5-1 2.5-2.6V7h1.8v8c0 2.6-1.7 4.2-4.3 4.2-2.2 0-3.9-1.3-4.1-3.4L9 15.2z" />
            </svg>
            <span>{PROFILE.osName}</span>
          </button>

          <span className="px-2 py-0.5 font-semibold text-white/95 whitespace-nowrap shrink-0">
            {activeWin ? activeWin.title.split('—')[0].trim() : 'Finder'}
          </span>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setAppleMenuOpen(false);
              setWindowMenuOpen(false);
              setControlCenterOpen(false);
              setStartSearch('');
              setStartMenuOpen((o) => !o);
            }}
            className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              startMenuOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            Apps
          </button>
          <button
            type="button"
            onClick={() => handleOpenApp('about')}
            className="px-2 py-0.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => handleOpenApp('projects')}
            className="px-2 py-0.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setAppleMenuOpen(false);
              setStartMenuOpen(false);
              setControlCenterOpen(false);
              setWindowMenuOpen((o) => !o);
            }}
            className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              windowMenuOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            Window
          </button>
        </div>

        {/* Right macOS Status Tray */}
        <div className="flex items-center gap-2 text-white/85">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              closeAllMenus();
              setSpotlightOpen(true);
              setSpotlightQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/12 transition-colors whitespace-nowrap shrink-0"
            title="Spotlight Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono text-white/65">⌘K</span>
          </button>

          <Wifi className="w-3.5 h-3.5 text-white/80 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setAppleMenuOpen(false);
              setStartMenuOpen(false);
              setWindowMenuOpen(false);
              setControlCenterOpen((o) => !o);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              controlCenterOpen ? 'bg-white/20 text-white' : 'hover:bg-white/12'
            }`}
            title="Control Center"
            aria-label="Open Control Center"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={exitToRoom}
            className="px-2.5 py-0.5 rounded-md bg-white/12 hover:bg-white/22 border border-white/[0.12] text-[11px] font-medium transition-colors whitespace-nowrap shrink-0"
          >
            3D Room
          </button>

          <span className="pl-1 font-medium tabular-nums whitespace-nowrap shrink-0">{macClock}</span>
        </div>
      </header>

      {/* ==========================================
          MOBILE iOS STATUS BAR & DYNAMIC ISLAND (< md)
      ========================================== */}
      <header className="flex md:hidden fixed top-0 inset-x-0 z-[90] h-11 px-5 bg-[#0D101B]/35 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.08] items-center justify-between text-xs font-semibold text-white">
        <span className="tabular-nums">{iosClock}</span>

        {/* iOS Dynamic Island Pill */}
        <button
          type="button"
          onClick={() => {
            setStartMenuOpen(false);
            setControlCenterOpen((o) => !o);
          }}
          className="h-7 px-3.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] flex items-center gap-2 text-[11px] font-medium"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: audioState.musicPlaying ? '#28C840' : accentHex }}
          />
          <span>{audioState.musicPlaying ? 'Liquid Morph' : 'JashedOS'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
          <BatteryCharging className="w-4 h-4" aria-hidden="true" />
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-12 md:top-10 left-1/2 -translate-x-1/2 z-[92] px-4 py-1.5 rounded-full border border-white/[0.22] bg-[#141826]/65 backdrop-blur-3xl backdrop-saturate-150 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_16px_40px_rgba(0,0,0,0.55)] pointer-events-none max-w-[92vw] truncate">
          {notification}
        </div>
      )}

      {/* ==========================================
          MAIN DESKTOP (macOS) & SPRINGBOARD (iOS)
      ========================================== */}
      <main className="relative z-10 h-[calc(100dvh-104px)] md:h-[calc(100dvh-112px)] mt-12 md:mt-8 px-4 sm:px-8 lg:px-12 py-4 sm:py-6 overflow-y-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Apple-Style Profile & iOS Widgets */}
        <section className="w-full lg:max-w-lg space-y-4">
          {/* Frosted Liquid Glass Hero Widget */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-white/[0.08] backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.22] liquid-glass space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={PROFILE.portraitPath}
                  alt={PROFILE.fullName}
                  className="w-12 h-12 rounded-2xl object-cover object-top border border-white/25"
                />
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none">
                    {PROFILE.initials}
                    <span style={{ color: accentHex }}>.dev</span>
                  </h1>
                  <p className="text-[11px] font-mono text-white/75 mt-1">{PROFILE.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={exitToRoom}
                className="md:hidden px-3 py-1.5 rounded-full bg-white/15 text-[11px] font-medium text-white shrink-0"
              >
                3D Room
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              {PROFILE.bioLead}
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenApp('editorial')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#070912] text-xs font-semibold hover:bg-white/90 transition-colors"
              >
                <span>Open AHJ Studio</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenApp('projects')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/12 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                <span>7 Projects</span>
              </button>
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center text-white/85"
                aria-label="GitHub"
                title="GitHub (@Jashedvai)"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
              <a
                href={PROFILE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center text-white/85"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={PROFILE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center text-white/85"
                aria-label="Instagram"
                title="Instagram (@john6260wick)"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={PROFILE.phoneHref}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center text-white/85"
                aria-label={`Call ${PROFILE.phone}`}
                title={PROFILE.phone}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* iOS-Style Now Building Liquid Glass Widget */}
          <button
            type="button"
            onClick={() => handleOpenApp('now')}
            className="w-full text-left p-4 rounded-[26px] bg-white/[0.07] hover:bg-white/[0.11] backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.18] liquid-glass transition-colors space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                Now Building
              </span>
              <span className="font-mono text-[11px] text-white/60">Tap to open</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NOW_BUILDING.slice(0, 2).map((nb) => (
                <div key={nb.id} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-white truncate">{nb.title}</span>
                    <span className="font-mono text-white/70 tabular-nums">{nb.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${nb.progress}%`, backgroundColor: accentHex }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </button>
        </section>

        {/* Right: iOS / macOS Squircle App Grid */}
        <section
          aria-label="Applications"
          className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:w-[390px] shrink-0 pb-6 lg:pb-0"
        >
          {DESKTOP_APPS.map((app) => {
            const Icon = app.icon;
            const isRunning = openWindows.some((w) => w.id === app.id);
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => handleOpenApp(app.id)}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-[15px] bg-gradient-to-br ${app.gradient} shadow-lg ring-1 ring-white/25 flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}
                >
                  <Icon className="w-6 h-6 drop-shadow" />
                  {isRunning && (
                    <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-white/90 text-center leading-tight drop-shadow">
                  {app.label}
                </span>
              </button>
            );
          })}
        </section>
      </main>

      {/* Drag-to-Snap Translucent Frosted Preview Overlay */}
      {snapPreview !== 'none' && (
        <div
          className={`hidden md:block fixed z-[85] rounded-[22px] border border-white/35 bg-white/[0.14] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] pointer-events-none transition-all duration-150 ${
            snapPreview === 'left'
              ? 'left-2 top-10 bottom-[86px] w-[calc(50vw-12px)]'
              : snapPreview === 'right'
                ? 'right-2 top-10 bottom-[86px] w-[calc(50vw-12px)]'
                : 'inset-x-2 top-10 bottom-[86px]'
          }`}
        />
      )}

      {/* Active Windows (macOS floating/snapped OR iOS mobile sheets) */}
      {openWindows.map((win) => (
        <WindowFrame key={win.id} win={win}>
          {renderAppContent(win.id)}
        </WindowFrame>
      ))}

      {/* Virtual Mechanical Keyboard */}
      <VirtualKeyboard />

      {/* Click-away backdrop for floating glass menus */}
      {(appleMenuOpen || windowMenuOpen || controlCenterOpen || startMenuOpen) && (
        <div
          className="fixed inset-0 z-[101]"
          onClick={closeAllMenus}
          aria-hidden="true"
        />
      )}

      {/* ==========================================
          APPLE MENU POPOVER & WINDOW SNAP MENU
      ========================================== */}
      {appleMenuOpen && (
        <div className="fixed top-9 left-3 z-[105] w-60 rounded-[20px] bg-[#131726]/58 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] p-1.5 liquid-glass text-xs">
          <button
            type="button"
            onClick={() => handleOpenApp('about')}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white transition-colors"
          >
            About This Developer
          </button>
          <button
            type="button"
            onClick={() => {
              setAppleMenuOpen(false);
              setStartSearch('');
              setStartMenuOpen(true);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white transition-colors flex justify-between"
          >
            <span>Applications &amp; Start Menu</span>
            <LayoutGrid className="w-3.5 h-3.5 text-white/60" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenApp('settings')}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white transition-colors"
          >
            System Settings...
          </button>
          <div className="my-1 h-px bg-white/[0.12] mx-1.5" />
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              setSpotlightOpen(true);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white flex justify-between transition-colors"
          >
            <span>Spotlight Search</span>
            <span className="text-white/55 font-mono">⌘K</span>
          </button>
          <div className="my-1 h-px bg-white/[0.12] mx-1.5" />
          <button
            type="button"
            onClick={exitToRoom}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 transition-colors flex items-center justify-between"
          >
            <span>Step Out to 3D Room</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {windowMenuOpen && (
        <div className="fixed top-9 left-52 z-[105] w-60 rounded-[20px] bg-[#131726]/58 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] p-1.5 liquid-glass text-xs">
          <button
            type="button"
            disabled={!activeWin}
            onClick={() => {
              if (activeWin) snapWindow(activeWin.id, 'left');
              setWindowMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white disabled:opacity-40 transition-colors"
          >
            Move &amp; Resize: Left Half
          </button>
          <button
            type="button"
            disabled={!activeWin}
            onClick={() => {
              if (activeWin) snapWindow(activeWin.id, 'right');
              setWindowMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white disabled:opacity-40 transition-colors"
          >
            Move &amp; Resize: Right Half
          </button>
          <button
            type="button"
            disabled={!activeWin}
            onClick={() => {
              if (activeWin) snapWindow(activeWin.id, 'top');
              setWindowMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white disabled:opacity-40 transition-colors"
          >
            Fill Desktop
          </button>
          <div className="my-1 h-px bg-white/[0.12] mx-1.5" />
          <button
            type="button"
            onClick={() => {
              minimizeAll();
              setWindowMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.15] text-white transition-colors"
          >
            Minimize All Windows
          </button>
        </div>
      )}

      {/* ==========================================
          APPLE LIQUID GLASS CONTROL CENTER
      ========================================== */}
      {controlCenterOpen && (
        <div className="fixed top-12 md:top-9 right-3 z-[105] w-[min(332px,calc(100vw-24px))] rounded-[26px] bg-[#131726]/55 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] p-3.5 liquid-glass space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Connectivity & Motion Capsule Column */}
            <div className="space-y-2">
              <div className="px-3 py-2.5 rounded-full bg-white/[0.1] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0A84FF] inline-flex items-center justify-center shadow-[0_4px_12px_rgba(10,132,255,0.45)] shrink-0">
                  <Wifi className="w-3.5 h-3.5 text-white" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white leading-tight truncate">JashedNet</div>
                  <div className="text-[10px] text-white/65 leading-tight">Connected</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReducedMotion((r) => !r)}
                className="w-full px-3 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] flex items-center gap-2.5 text-left transition-colors"
              >
                <span
                  className={`w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 transition-colors ${
                    reducedMotion ? 'bg-amber-500/80 text-white' : 'bg-white/15 text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white leading-tight">Motion</div>
                  <div className="text-[10px] text-white/65 leading-tight">
                    {reducedMotion ? 'Reduced' : 'Smooth'}
                  </div>
                </div>
              </button>
            </div>

            {/* Now Playing Liquid Glass Tile */}
            <div className="p-3 rounded-[22px] bg-white/[0.09] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/70 to-fuchsia-500/70 border border-white/25 flex items-center justify-center shadow-inner">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => soundEngine.setMuted(!audioState.muted)}
                  className={`w-7 h-7 rounded-full border border-white/15 inline-flex items-center justify-center transition-colors ${
                    audioState.muted
                      ? 'bg-rose-500/30 text-rose-300'
                      : 'bg-white/10 hover:bg-white/20 text-white/85'
                  }`}
                  aria-label="Toggle Mute"
                  title={audioState.muted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {audioState.muted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="mt-2">
                <div className="font-semibold text-white leading-tight truncate">
                  {audioState.musicPlaying ? 'Liquid Morph' : 'Ambient Synth'}
                </div>
                <div className="text-[10px] text-white/60">
                  {audioState.musicPlaying ? 'Playing' : 'Ready'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => soundEngine.toggleMusic()}
                className="mt-2 py-1.5 px-3 rounded-full text-[11px] font-semibold text-white shadow-sm transition-transform active:scale-95 inline-flex items-center justify-center gap-1.5"
                style={{ backgroundColor: accentHex }}
              >
                {audioState.musicPlaying ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Play Synth</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sound Glass Slider */}
          <div className="p-3 rounded-[20px] bg-white/[0.08] border border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/80 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-white/70" />
                Sound
              </span>
              <span className="tabular-nums font-mono">{Math.round(audioState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audioState.volume * 100)}
              onChange={(e) => soundEngine.setVolume(Number(e.target.value) / 100)}
              className="w-full accent-[#0A84FF] cursor-pointer"
            />
          </div>

          {/* Circular & Capsule Quick Controls Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVirtualKeyboard((v) => !v)}
              className={`w-9 h-9 rounded-full border border-white/[0.18] inline-flex items-center justify-center transition-colors shrink-0 ${
                showVirtualKeyboard
                  ? 'bg-[#0A84FF] text-white'
                  : 'bg-white/[0.09] hover:bg-white/[0.16] text-white/85'
              }`}
              title="Toggle Keyboard Deck"
              aria-label="Toggle Keyboard Deck"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWallpaper(wallpaper === 'sonoma' ? 'room-iso' : 'sonoma')}
              className="flex-1 py-2 rounded-full bg-white/[0.09] hover:bg-white/[0.16] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] text-white font-medium transition-colors"
            >
              Wallpaper
            </button>
            <button
              type="button"
              onClick={() => handleOpenApp('settings')}
              className="flex-1 py-2 rounded-full bg-white/[0.09] hover:bg-white/[0.16] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] text-white font-medium transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          START MENU / LAUNCHPAD GLASS OVERLAY
      ========================================== */}
      {startMenuOpen && (
        <div
          role="dialog"
          aria-label="Applications Start Menu"
          className="fixed bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 z-[105] w-[min(560px,calc(100vw-24px))] rounded-[28px] bg-[#111524]/58 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] p-4 sm:p-5 liquid-glass space-y-4"
        >
          {/* Search Bar inside Start Menu */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.14] focus-within:border-white/30">
            <Search className="w-4 h-4 text-white/60 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={startSearch}
              onChange={(e) => setStartSearch(e.target.value)}
              placeholder="Search JashedOS apps..."
              autoFocus
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none"
            />
            {startSearch && (
              <button
                type="button"
                onClick={() => setStartSearch('')}
                className="text-white/60 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* App Squircle Launcher Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[44dvh] overflow-y-auto py-1">
            {startMenuApps.map((app) => {
              const Icon = app.icon;
              const isRunning = openWindows.some((w) => w.id === app.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleOpenApp(app.id)}
                  className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.09] transition-colors"
                >
                  <div
                    className={`relative w-12 h-12 rounded-[15px] bg-gradient-to-br ${app.gradient} shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.4)] ring-1 ring-white/25 flex items-center justify-center text-white transition-transform duration-150 group-hover:scale-105 group-active:scale-95`}
                  >
                    <Icon className="w-5 h-5" />
                    {isRunning && (
                      <span className="absolute -bottom-1.5 w-1.5 h-1 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-white/90 text-center leading-tight truncate max-w-full">
                    {app.label}
                  </span>
                </button>
              );
            })}
            {startMenuApps.length === 0 && (
              <p className="col-span-full py-6 text-center text-xs text-white/55">
                No applications match “{startSearch}”.
              </p>
            )}
          </div>

          {/* Start Menu Footer (User Profile + Quick System Controls) */}
          <div className="pt-3 border-t border-white/[0.12] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleOpenApp('about')}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity text-left"
            >
              <img
                src={PROFILE.portraitPath}
                alt={PROFILE.fullName}
                className="w-8 h-8 rounded-full object-cover object-top border border-white/25 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{PROFILE.fullName}</div>
                <div className="text-[10px] font-mono text-white/60 truncate">{PROFILE.osName}</div>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenApp('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.09] hover:bg-white/[0.16] border border-white/[0.12] text-[11px] font-medium text-white transition-colors whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={exitToRoom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/25 text-[11px] font-medium text-rose-200 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>3D Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SPOTLIGHT SEARCH MODAL (⌘K)
      ========================================== */}
      {spotlightOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-md flex items-start justify-center pt-20 px-4"
          onClick={() => setSpotlightOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[26px] border border-white/[0.24] bg-[#141826]/60 backdrop-blur-3xl backdrop-saturate-150 liquid-glass overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.12]">
              <Search className="w-4 h-4 text-white/65" aria-hidden="true" />
              <input
                type="text"
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                placeholder="Spotlight Search"
                autoFocus
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="text-white/60 hover:text-white"
                aria-label="Close Spotlight"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {spotlightResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenApp(item.id, item.title)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-[#0A84FF]/85 hover:text-white flex items-center justify-between text-left transition-colors group"
                >
                  <span className="text-sm font-medium text-white">{item.title}</span>
                  <span className="text-xs text-white/55 group-hover:text-white/90">
                    {item.subtitle}
                  </span>
                </button>
              ))}
              {spotlightResults.length === 0 && (
                <p className="p-4 text-center text-xs text-white/50">
                  No Spotlight matches found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DESKTOP MACOS FLOATING GLASS DOCK (>= md)
      ========================================== */}
      <footer className="hidden md:flex fixed bottom-2.5 left-1/2 -translate-x-1/2 z-[100] px-3 py-2 rounded-[26px] bg-white/[0.11] backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] liquid-glass items-end gap-2">
        {/* Start Menu / Launchpad Trigger */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playMouseClick();
            setAppleMenuOpen(false);
            setWindowMenuOpen(false);
            setControlCenterOpen(false);
            setStartSearch('');
            setStartMenuOpen((o) => !o);
          }}
          className="group relative flex flex-col items-center transition-transform duration-200 hover:scale-115 hover:-translate-y-1.5"
          title="Applications Start Menu"
          aria-label="Open Applications Start Menu"
        >
          <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-[#121626]/80 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            Start Menu
          </span>
          <div
            className={`w-10 h-10 rounded-[13px] ring-1 flex items-center justify-center transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_18px_rgba(0,0,0,0.38)] ${
              startMenuOpen
                ? 'bg-white/30 ring-white/50 text-white'
                : 'bg-white/[0.14] hover:bg-white/[0.22] ring-white/25 text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </div>
          {startMenuOpen && <span className="mt-1 w-1.5 h-1 rounded-full bg-white" />}
        </button>

        <div className="w-px h-8 bg-white/20 mx-0.5 self-center" />

        {MAC_DOCK_PINNED.map((dockId) => {
          const meta = DESKTOP_APPS.find((a) => a.id === dockId);
          if (!meta) return null;
          const Icon = meta.icon;
          const win = openWindows.find((w) => w.id === dockId);
          const isActive = activeWindowId === dockId && !win?.isMinimized;
          return (
            <button
              key={dockId}
              type="button"
              onClick={() => {
                soundEngine.playMouseClick();
                closeAllMenus();
                if (win) {
                  if (isActive) minimizeApp(dockId);
                  else focusApp(dockId);
                } else {
                  handleOpenApp(dockId);
                }
              }}
              className="group relative flex flex-col items-center transition-transform duration-200 hover:scale-120 hover:-translate-y-2"
              title={meta.label}
              aria-label={meta.label}
            >
              <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-[#121626]/80 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                {meta.label}
              </span>
              <div
                className={`w-10 h-10 rounded-[13px] bg-gradient-to-br ${meta.gradient} shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.4)] ring-1 ring-white/30 flex items-center justify-center text-white`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {win && (
                <span
                  className={`mt-1 w-1.5 h-1 rounded-full transition-opacity ${
                    isActive ? 'bg-white' : 'bg-white/45'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Open / Minimized Non-Pinned Taskbar Windows */}
        {extraTaskbarWindows.length > 0 && (
          <>
            <div className="w-px h-8 bg-white/20 mx-0.5 self-center" />
            {extraTaskbarWindows.map((win) => {
              const meta = DESKTOP_APPS.find((a) => a.id === win.id);
              const Icon = meta?.icon || Layers;
              const gradient = meta?.gradient || 'from-indigo-500 to-violet-600';
              const isActive = activeWindowId === win.id && !win.isMinimized;
              const shortLabel = meta?.label || win.title.split('—')[0].trim();
              return (
                <button
                  key={win.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playMouseClick();
                    closeAllMenus();
                    if (isActive) minimizeApp(win.id);
                    else focusApp(win.id);
                  }}
                  className="group relative flex flex-col items-center transition-transform duration-200 hover:scale-120 hover:-translate-y-2"
                  title={win.title}
                  aria-label={win.title}
                >
                  <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-[#121626]/80 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {shortLabel}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-[13px] bg-gradient-to-br ${gradient} shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.4)] ring-1 ring-white/30 flex items-center justify-center text-white ${
                      win.isMinimized ? 'opacity-70' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`mt-1 w-1.5 h-1 rounded-full transition-opacity ${
                      isActive ? 'bg-white' : 'bg-white/45'
                    }`}
                  />
                </button>
              );
            })}
          </>
        )}

        <div className="w-px h-8 bg-white/20 mx-0.5 self-center" />

        <button
          type="button"
          onClick={() => {
            soundEngine.playMouseClick();
            setShowVirtualKeyboard((v) => !v);
          }}
          className={`group relative w-10 h-10 rounded-[13px] ring-1 flex items-center justify-center transition-all duration-200 hover:scale-115 hover:-translate-y-1.5 ${
            showVirtualKeyboard
              ? 'bg-[#0A84FF] ring-white/40 text-white shadow-[0_8px_20px_rgba(10,132,255,0.45)]'
              : 'bg-white/[0.12] ring-white/20 text-white/85 hover:bg-white/[0.2]'
          }`}
          title="Virtual Mechanical Keyboard"
          aria-label="Toggle virtual keyboard"
        >
          <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-[#121626]/80 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            Keyboard Deck
          </span>
          <Keyboard className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={exitToRoom}
          className="group relative w-10 h-10 rounded-[13px] bg-white/[0.12] hover:bg-white/[0.2] ring-1 ring-white/20 text-white/90 flex items-center justify-center transition-all duration-200 hover:scale-115 hover:-translate-y-1.5"
          title="Return to 3D Studio Room"
          aria-label="Return to 3D Studio Room"
        >
          <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-[#121626]/80 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            3D Room
          </span>
          <Monitor className="w-5 h-5" />
        </button>
      </footer>

      {/* ==========================================
          MOBILE iOS BOTTOM DOCK (< md)
      ========================================== */}
      <footer className="flex md:hidden fixed bottom-3 inset-x-4 z-[90] px-3.5 py-2 rounded-[28px] bg-[#141826]/55 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.24] items-center justify-around liquid-glass">
        <button
          type="button"
          onClick={() => {
            soundEngine.playMouseClick();
            setControlCenterOpen(false);
            setStartSearch('');
            setStartMenuOpen((o) => !o);
          }}
          className={`w-11 h-11 rounded-[14px] ring-1 flex items-center justify-center text-white active:scale-90 transition-transform ${
            startMenuOpen ? 'bg-white/25 ring-white/45' : 'bg-white/[0.14] ring-white/25'
          }`}
          aria-label="Open Applications Start Menu"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        {IOS_DOCK_PINNED.map((dockId) => {
          const meta = DESKTOP_APPS.find((a) => a.id === dockId);
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <button
              key={dockId}
              type="button"
              onClick={() => handleOpenApp(dockId)}
              className={`w-11 h-11 rounded-[14px] bg-gradient-to-br ${meta.gradient} shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.4)] ring-1 ring-white/30 flex items-center justify-center text-white active:scale-90 transition-transform`}
              aria-label={meta.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </footer>
    </div>
  );
}
