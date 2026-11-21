import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Facebook,
  Github,
  Info,
  Instagram,
  Layers,
  Mail,
  MapPin,
  MousePointer2,
  Orbit,
  Phone,
  RotateCw,
  Send,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { ACCENT_COLORS, useWorkspace } from '../../../context/WorkspaceContext';
import {
  COLLABORATIVE_BUILDS,
  JOURNEY_MILESTONES,
  PERSONAL_INTERESTS,
  PROFILE,
  PROJECTS,
  ProjectCategory,
  ProjectItem,
  TOOLKIT_GROUPS,
} from '../../../data/portfolioData';
import { soundEngine } from '../../../audio/soundEngine';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { isWebGLAvailable } from '../../../three/webglUtils';
import {
  AhjHeroController,
  HeroInteractionMode,
  mountAhjHeroScene,
} from '../../../three/ahjHeroScene';
import {
  JourneyStaircaseController,
  mountJourneyStaircaseScene,
} from '../../../three/journeyStaircaseScene';

const PROJECT_CATEGORIES: ProjectCategory[] = ['All', 'AI & ML', 'Software', 'Android'];

export function EditorialApp() {
  const { openApp, accent, reducedMotion } = useWorkspace();
  const accentHex = ACCENT_COLORS[accent].hex;

  // Refs for scrolling smoothly inside the OS window scroll container
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLElement | null>(null);
  const journeyRef = useRef<HTMLElement | null>(null);
  const projectsRef = useRef<HTMLElement | null>(null);
  const skillsRef = useRef<HTMLElement | null>(null);
  const interestsRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);

  // AHJ 3D Hero Scene state (IntersectionObserver-gated GPU lifecycle)
  const heroHostRef = useRef<HTMLDivElement | null>(null);
  const heroCtrlRef = useRef<AhjHeroController | null>(null);
  const { ref: heroObserverRef, isIntersecting: isHeroVisible } =
    useIntersectionObserver<HTMLDivElement>({ threshold: 0.05, rootMargin: '80px' });
  const [heroWebglFailed, setHeroWebglFailed] = useState<boolean>(() => !isWebGLAvailable());
  const [heroMode, setHeroMode] = useState<HeroInteractionMode>('pointer');
  const [heroAutoRotate, setHeroAutoRotate] = useState(true);

  // Desktop 3D Journey Staircase state (IntersectionObserver-gated GPU lifecycle)
  const staircaseHostRef = useRef<HTMLDivElement | null>(null);
  const staircaseCtrlRef = useRef<JourneyStaircaseController | null>(null);
  const { ref: staircaseObserverRef, isIntersecting: isStaircaseVisible } =
    useIntersectionObserver<HTMLDivElement>({ threshold: 0.05, rootMargin: '80px' });
  const [staircaseWebglFailed, setStaircaseWebglFailed] = useState<boolean>(
    () => !isWebGLAvailable()
  );
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );
  const [selectedStep, setSelectedStep] = useState(0);

  // 7 Project Showcase Cards & Popup state
  const [projectFilter, setProjectFilter] = useState<ProjectCategory>('All');
  const [popupProject, setPopupProject] = useState<ProjectItem | null>(null);
  const [popupImageIndex, setPopupImageIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Contact state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMsg, setSenderMsg] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);

  // Track responsive breakpoint so mobile doesn't allocate a hidden WebGL staircase context
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktopViewport(e.matches);
    setIsDesktopViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Mount Custom AHJ 3D Hero Scene only while visible in viewport
  useEffect(() => {
    const host = heroHostRef.current;
    if (!host || heroWebglFailed || !isHeroVisible) return;

    try {
      const ctrl = mountAhjHeroScene({
        container: host,
        accentHex,
        backgroundHex: '#162338',
        reducedMotion,
        onContextLost: () => setHeroWebglFailed(true),
      });
      heroCtrlRef.current = ctrl;
      return () => {
        ctrl.dispose();
        heroCtrlRef.current = null;
        host.innerHTML = '';
      };
    } catch {
      setHeroWebglFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroWebglFailed, isHeroVisible]);

  useEffect(() => {
    heroCtrlRef.current?.setAccentColor(accentHex);
  }, [accentHex]);

  useEffect(() => {
    heroCtrlRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    heroCtrlRef.current?.setInteractionMode(heroMode);
  }, [heroMode]);

  useEffect(() => {
    heroCtrlRef.current?.setAutoRotate(heroAutoRotate);
  }, [heroAutoRotate]);

  // Mount Desktop 3D Journey Staircase Scene only on >= md viewports and while visible
  useEffect(() => {
    const host = staircaseHostRef.current;
    if (!host || staircaseWebglFailed || !isDesktopViewport || !isStaircaseVisible) return;

    try {
      const ctrl = mountJourneyStaircaseScene({
        container: host,
        initialIndex: selectedStep,
        onSelectMilestone: (idx) => setSelectedStep(idx),
        onContextLost: () => setStaircaseWebglFailed(true),
      });
      staircaseCtrlRef.current = ctrl;
      return () => {
        ctrl.dispose();
        staircaseCtrlRef.current = null;
        host.innerHTML = '';
      };
    } catch {
      setStaircaseWebglFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staircaseWebglFailed, isDesktopViewport, isStaircaseVisible]);

  useEffect(() => {
    staircaseCtrlRef.current?.selectMilestone(selectedStep);
  }, [selectedStep]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popupProject) {
        setPopupProject(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [popupProject]);

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    soundEngine.playMouseClick();
    ref.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const sevenProjects = PROJECTS.slice(0, 7);
  const filteredProjects =
    projectFilter === 'All'
      ? sevenProjects
      : sevenProjects.filter((p) => p.filterGroup === projectFilter);

  const openProjectPopup = (project: ProjectItem) => {
    soundEngine.playWindowOpen();
    setPopupProject(project);
    setPopupImageIndex(0);
  };

  const handleCopyEmail = async () => {
    soundEngine.playMouseClick();
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(false);
    }
  };

  const handleCopyPhone = async () => {
    soundEngine.playMouseClick();
    try {
      await navigator.clipboard.writeText(PROFILE.phone);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(false);
    }
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !senderMsg.trim()) {
      setContactError('Please complete your name, email, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      setContactError('Please enter a valid email address.');
      return;
    }
    soundEngine.playWindowOpen();
    setContactError(null);
    setContactSent(true);
  };

  const activeMilestone = JOURNEY_MILESTONES[selectedStep];
  const popupImages = popupProject
    ? popupProject.gallery && popupProject.gallery.length > 0
      ? popupProject.gallery
      : [popupProject.image]
    : [];

  return (
    <div ref={scrollRootRef} className="relative min-h-full text-[#F4F5F7]">
      {/* =========================================================
          1. EDITORIAL NAVIGATION (Sticky Glassmorphic 3-Zone Header)
      ========================================================= */}
      <header className="sticky top-0 z-30 px-4 sm:px-7 py-3 bg-[#0C101B]/80 backdrop-blur-2xl border-b border-white/[0.12] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => scrollToSection(overviewRef)}
          className="font-display font-semibold text-base sm:text-lg tracking-tight text-white whitespace-nowrap shrink-0"
        >
          {PROFILE.initials}
          <span style={{ color: accentHex }}>.dev</span>
        </button>

        <nav
          aria-label="Editorial portfolio sections"
          className="flex items-center gap-4 sm:gap-5 overflow-x-auto text-xs font-medium text-white/75"
        >
          <button
            type="button"
            onClick={() => scrollToSection(overviewRef)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(journeyRef)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Journey
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(projectsRef)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(skillsRef)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Skills
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(interestsRef)}
            className="hidden sm:inline hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Interests
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(contactRef)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Contact
          </button>
        </nav>

        <button
          type="button"
          onClick={() => openApp('resume')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-[#070912] text-xs font-bold hover:bg-white/90 transition-colors whitespace-nowrap shrink-0"
        >
          <span>Resume</span>
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </header>

      <div className="p-4 sm:p-7 space-y-12 max-w-6xl mx-auto">
        {/* =========================================================
            2. FRONT CARD: PERIWINKLE 3D CUTOUT + HEY THIS IS JASHED
               (Clean Reference Layout — Zero Unnecessary Intro Text)
        ========================================================= */}
        <section ref={overviewRef} className="space-y-6 scroll-mt-16">
          <div className="rounded-3xl bg-[#101114] border border-white/[0.14] shadow-[0_28px_80px_rgba(0,0,0,0.65)] p-4 sm:p-6 space-y-4 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* LEFT: Cool Slate-Cobalt 3D Cutout Panel with Custom 3D AHJ Monogram */}
              <div
                ref={heroObserverRef}
                className="lg:col-span-7 relative rounded-2xl bg-[#162338] overflow-hidden min-h-[300px] sm:min-h-[370px] flex flex-col"
              >
                {/* Top-Left Geometric Corner Cutout Mark */}
                <div className="absolute top-0 left-0 z-10 bg-[#101114] pr-4 pb-3 pt-1 pl-1.5 rounded-br-2xl flex items-center gap-1.5">
                  <div className="grid grid-cols-2 gap-1 font-mono text-xs leading-none text-white/90 tracking-widest">
                    <span className="border border-white/50 px-1 py-0.5 rounded-[3px]">0</span>
                    <span className="border border-white/50 px-1 py-0.5 rounded-[3px]">1</span>
                    <span className="border border-white/50 px-1 py-0.5 rounded-[3px]">A</span>
                    <span className="border border-white/50 px-1 py-0.5 rounded-[3px]">J</span>
                  </div>
                </div>

                {/* 3D WebGL Canvas OR Clean Standby / SVG Fallback */}
                <div className="flex-1 relative">
                  {!heroWebglFailed ? (
                    <div
                      ref={heroHostRef}
                      className="w-full h-[270px] sm:h-[330px]"
                      aria-label="Interactive 3D metallic AHJ monogram and animated abstract chrome sculpture"
                    />
                  ) : (
                    <div className="w-full h-[270px] sm:h-[330px] flex flex-col items-center justify-center p-6 text-center">
                      <div className="font-display text-6xl sm:text-7xl font-bold tracking-[0.18em] text-white/90">
                        AHJ
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom-Right Notched Tag inside Slate-Cobalt Panel */}
                <div className="flex items-end justify-between bg-[#162338]">
                  <div className="px-3 py-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMouseClick();
                        setHeroMode(heroMode === 'pointer' ? 'inspect' : 'pointer');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#101114]/85 text-[11px] font-mono text-white hover:bg-[#101114] transition-colors whitespace-nowrap shrink-0"
                    >
                      {heroMode === 'inspect' ? (
                        <Orbit className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <MousePointer2 className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>{heroMode === 'inspect' ? 'Inspect' : 'Pointer'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMouseClick();
                        setHeroAutoRotate((v) => !v);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#101114]/85 text-[11px] font-mono text-white hover:bg-[#101114] transition-colors whitespace-nowrap shrink-0"
                    >
                      <RotateCw className="w-3 h-3" aria-hidden="true" />
                      <span>{heroAutoRotate ? 'Spin' : 'Pause'}</span>
                    </button>
                  </div>

                  <div className="bg-[#101114] pl-4 pr-3 pt-2.5 pb-1.5 rounded-tl-2xl text-right">
                    <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-white/75 mr-1.5">
                      Role
                    </span>
                    <span className="font-display text-sm sm:text-base font-semibold text-white">
                      Creative Developer
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Bold Architectural Typography Stack (No Filler Paragraphs) */}
              <div className="lg:col-span-5 relative flex flex-col justify-between py-2 px-1 sm:px-2">
                {/* Subtle Wireframe Geometric Sphere Accent */}
                <svg
                  viewBox="0 0 64 64"
                  className="hidden sm:block absolute top-8 right-2 w-12 h-12 text-white/20 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  aria-hidden="true"
                >
                  <polygon points="32,4 58,20 52,50 12,50 6,20" />
                  <polygon points="32,12 48,26 40,46 24,46 16,26" />
                  <line x1="32" y1="4" x2="32" y2="60" />
                  <line x1="6" y1="20" x2="58" y2="20" />
                  <line x1="12" y1="50" x2="52" y2="50" />
                </svg>

                <div className="space-y-1">
                  <div className="font-display font-extrabold uppercase tracking-[0.04em] leading-[0.95]">
                    <div className="text-4xl sm:text-5xl text-white">HEY</div>
                    <div className="text-4xl sm:text-5xl text-white">THIS</div>
                    <div className="text-4xl sm:text-5xl text-white">IS</div>
                    <div className="text-4xl sm:text-5xl text-outline-hero">JASHED</div>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <div className="font-display font-bold uppercase text-sm sm:text-base leading-tight tracking-wide text-white/95">
                    <div>FULL-STACK</div>
                    <div>ANDROID &amp;</div>
                    <div>AI BUILDER</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection(projectsRef)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#070912] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                    >
                      <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>7 Projects</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openApp('about')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.14] bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                    >
                      <span>Profile</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip matching Reference Footer */}
            <div className="pt-3 border-t border-white/[0.1] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
                <a
                  href={PROFILE.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
                <a
                  href={PROFILE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a href={PROFILE.phoneHref} className="hover:text-white transition-colors">
                  {PROFILE.phone}
                </a>
                <a href={`mailto:${PROFILE.email}`} className="hover:text-white transition-colors">
                  Email
                </a>
              </div>

              <button
                type="button"
                onClick={() => scrollToSection(journeyRef)}
                className="font-mono tracking-[0.2em] uppercase text-white/80 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                — EXPLORE THE SCROLL —
              </button>

              <button
                type="button"
                onClick={() => openApp('resume')}
                className="font-mono text-right uppercase tracking-wider text-white/80 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                DISCOVER · AHJ STUDIO
              </button>
            </div>
          </div>

          {/* Portrait Gallery Strip & 3 Engineering Differentiators */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-5 p-3 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] grid grid-cols-3 gap-2.5 items-stretch">
              <div className="col-span-2 rounded-xl overflow-hidden border border-white/[0.12] bg-[#090C14]">
                <img
                  src={PROFILE.portraitPath}
                  alt="Md. Ahsanul Haque Jashed personal portrait"
                  referrerPolicy="no-referrer"
                  className="w-full h-[180px] object-cover object-top"
                />
              </div>
              <div className="grid grid-rows-2 gap-2">
                <div className="rounded-xl overflow-hidden border border-white/[0.12] bg-[#090C14]">
                  <img
                    src={PROFILE.portraitCampus}
                    alt="Jashed at Chittagong Polytechnic Institute campus"
                    referrerPolicy="no-referrer"
                    className="w-full h-[86px] object-cover object-top"
                  />
                </div>
                <div className="rounded-xl overflow-hidden border border-white/[0.12] bg-[#090C14]">
                  <img
                    src={PROFILE.setupPhotoDark}
                    alt="Jashed dual-monitor studio workstation"
                    referrerPolicy="no-referrer"
                    className="w-full h-[86px] object-cover object-center"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROFILE.differentiators.map((diff, i) => (
                <div
                  key={diff.title}
                  className="p-4 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] space-y-1.5 flex flex-col justify-between"
                >
                  <p className="text-xs font-mono text-[#38BDF8] tabular-nums">0{i + 1}</p>
                  <h2 className="font-display text-sm font-semibold text-white">{diff.title}</h2>
                  <p className="text-[11px] text-[#A1A7B3] leading-relaxed">{diff.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            3. JOURNEY: 3D STAIRCASE (Desktop) + MILESTONE CARDS (Mobile)
        ========================================================= */}
        <section ref={journeyRef} className="space-y-5 scroll-mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-white/[0.1]">
            <div>
              <p className="text-xs font-mono text-[#38BDF8]">
                01 — {String(JOURNEY_MILESTONES.length).padStart(2, '0')} Engineering Progression
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Development Journey
              </h2>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStep((i) => Math.max(0, i - 1))}
                disabled={selectedStep === 0}
                className="w-9 h-9 rounded-lg border border-white/[0.14] bg-white/[0.06] inline-flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-35"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStep((i) => Math.min(JOURNEY_MILESTONES.length - 1, i + 1))
                }
                disabled={selectedStep === JOURNEY_MILESTONES.length - 1}
                className="w-9 h-9 rounded-lg border border-white/[0.14] bg-white/[0.06] inline-flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-35"
                aria-label="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DESKTOP: Interactive 3D Journey Staircase */}
          <div className="hidden md:block space-y-4">
            <div ref={staircaseObserverRef}>
              {!staircaseWebglFailed ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.14] bg-[#06080F] h-[300px]">
                  <div ref={staircaseHostRef} className="w-full h-full" />
                  {!isStaircaseVisible && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[#9CA3AF]">
                      3D Staircase standby
                    </div>
                  )}
                  <div className="px-3 py-1 rounded bg-[#07090E]/90 border border-white/10 text-[11px] font-mono text-[#9CA3AF] absolute bottom-3 left-3 pointer-events-none">
                    Drag to orbit · Click any 3D step
                  </div>
                </div>
              ) : (
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] grid grid-cols-10 gap-1.5 items-end h-[160px]">
                {JOURNEY_MILESTONES.map((m, idx) => (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => setSelectedStep(idx)}
                    style={{ height: `${30 + idx * 7}%` }}
                    className={`rounded-t-lg border p-1.5 text-left flex flex-col justify-between ${
                      selectedStep === idx
                        ? 'bg-white/15 border-[#38BDF8]'
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-mono tabular-nums text-[#38BDF8]">
                      {m.index}
                    </span>
                    <span className="text-[10px] truncate text-white/85">{m.title}</span>
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* Quick Step Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {JOURNEY_MILESTONES.map((m, idx) => {
                const isSel = idx === selectedStep;
                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => setSelectedStep(idx)}
                    style={{
                      borderColor: isSel ? m.accentHex : undefined,
                      backgroundColor: isSel ? `${m.accentHex}24` : undefined,
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0 ${
                      isSel
                        ? 'text-white font-semibold'
                        : 'border-white/[0.12] bg-white/[0.04] text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {m.index} · {m.title}
                  </button>
                );
              })}
            </div>

            {/* Active Milestone Glass Readout */}
            <div className="p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span style={{ color: activeMilestone.accentHex }}>
                  Step {activeMilestone.index} · {activeMilestone.phase}
                </span>
                <span className="text-[#9CA3AF]">
                  {activeMilestone.technologies.join(' · ')}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white">{activeMilestone.title}</h3>
              <p className="text-sm text-[#D1D5DB] leading-relaxed">{activeMilestone.summary}</p>
              <ul className="space-y-1.5 pt-2 border-t border-white/[0.08] text-xs sm:text-sm text-[#A1A7B3]">
                {activeMilestone.highlights.map((h) => (
                  <li key={h}>· {h}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* MOBILE: Mobile-Friendly Milestone Cards (< md) */}
          <div className="grid md:hidden grid-cols-1 gap-3">
            {JOURNEY_MILESTONES.map((m) => (
              <article
                key={m.index}
                className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span style={{ color: m.accentHex }} className="tabular-nums font-semibold">
                    {m.index} · {m.phase}
                  </span>
                  <span className="text-[#9CA3AF] truncate">{m.technologies.join(' / ')}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white">{m.title}</h3>
                <p className="text-xs text-[#C7CDD8] leading-relaxed">{m.summary}</p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================================================
            4. SEVEN PROJECT SHOWCASE CARDS + PROJECT DETAIL POPUPS
        ========================================================= */}
        <section ref={projectsRef} className="space-y-5 scroll-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-white/[0.1]">
            <div>
              <p className="text-xs font-mono text-[#38BDF8]">7 Key Engineering &amp; Product Builds</p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Project Showcase
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.12]">
              {PROJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEngine.playMouseClick();
                    setProjectFilter(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    projectFilter === cat
                      ? 'bg-white text-[#070912] font-semibold'
                      : 'text-[#A1A7B3] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 7 Project Showcase Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, idx) => (
              <button
                key={project.id}
                type="button"
                aria-describedby={`project-challenge-${project.id}`}
                onClick={() => openProjectPopup(project)}
                className={`group relative text-left rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.14] hover:border-[#38BDF8]/60 transition-colors overflow-hidden flex flex-col justify-between ${
                  idx === 0 && projectFilter === 'All' ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div
                  className={`relative w-full bg-[#070A12] border-b border-white/[0.1] overflow-hidden ${
                    idx === 0 && projectFilter === 'All' ? 'aspect-[16/8]' : 'aspect-[16/10]'
                  }`}
                >
                  {!brokenImages[project.id] ? (
                    <img
                      src={project.image}
                      alt={`${project.title} showcase`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [project.id]: true }))
                      }
                      className={`w-full h-full object-cover object-top ${
                        reducedMotion
                          ? ''
                          : 'transition-transform duration-500 group-hover:scale-[1.03]'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[#9CA3AF]">
                      {project.title}
                    </div>
                  )}

                  {/* Hover & focus tooltip summarizing the core challenge solved */}
                  <div
                    id={`project-challenge-${project.id}`}
                    role="tooltip"
                    className={`pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-xl border border-white/20 bg-[#0E1117]/95 p-3 shadow-lg shadow-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 ${
                      reducedMotion
                        ? 'transition-opacity duration-75'
                        : 'translate-y-1.5 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-all duration-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#38BDF8] mb-1">
                      <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Core challenge solved</span>
                    </div>
                    <p className="text-xs text-[#E5E7EB] leading-snug line-clamp-3">
                      {project.problem}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#9CA3AF]">
                      <span className="text-[#38BDF8] truncate">{project.categoryLabel}</span>
                      <span className="tabular-nums shrink-0">{project.year}</span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#B4BAC6] leading-relaxed line-clamp-2">
                      {project.summary}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs font-mono text-[#8B93A3]">
                    <span className="truncate">{project.stack.slice(0, 3).join(' · ')}</span>
                    <span className="inline-flex items-center gap-1 text-white group-hover:text-[#38BDF8] shrink-0">
                      Details
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Collaborative & Platform Builds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {COLLABORATIVE_BUILDS.map((build) => (
              <div
                key={build.title}
                className="p-4 sm:p-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[#38BDF8]">{build.badge}</span>
                  <span className="text-[#9CA3AF] truncate">{build.stack}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white">{build.title}</h3>
                <p className="text-xs text-[#B4BAC6] leading-relaxed">{build.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            5. SKILLS & TECHNOLOGY SECTION
        ========================================================= */}
        <section ref={skillsRef} className="space-y-5 scroll-mt-16">
          <div className="pb-3 border-b border-white/[0.1]">
            <p className="text-xs font-mono text-[#38BDF8]">Technical Competencies</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Skills &amp; Technology Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLKIT_GROUPS.map((group, gIdx) => (
              <div
                key={group.category}
                className="p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-4"
              >
                <div className="flex items-baseline justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">{group.category}</h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{group.description}</p>
                  </div>
                  <span className="text-xs font-mono text-[#6E7685] tabular-nums">
                    0{gIdx + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="font-mono text-[#38BDF8] shrink-0">{item.level}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#38BDF8]"
                          style={{ width: `${item.ratio}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#9CA3AF]">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            6. PERSONAL INTERESTS SECTION
        ========================================================= */}
        <section ref={interestsRef} className="space-y-5 scroll-mt-16">
          <div className="pb-3 border-b border-white/[0.1]">
            <p className="text-xs font-mono text-[#38BDF8]">Beyond Engineering</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Personal Interests &amp; Creative Craft
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERSONAL_INTERESTS.map((interest) => (
              <div
                key={interest.id}
                className="p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#38BDF8]">{interest.tag}</span>
                  <Sparkles className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-white">{interest.title}</h3>
                <p className="text-xs sm:text-sm text-[#B4BAC6] leading-relaxed">
                  {interest.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            7. CONTACT & SOCIAL LINKS SECTION
        ========================================================= */}
        <section ref={contactRef} className="space-y-5 pb-4 scroll-mt-16">
          <div className="pb-3 border-b border-white/[0.1]">
            <p className="text-xs font-mono text-[#38BDF8]">
              Open to Software Engineering Internships &amp; Junior Roles
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Contact &amp; Social Links
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
                  <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                  <span>{PROFILE.location}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-white truncate">
                    <Mail className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span className="truncate">{PROFILE.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white shrink-0"
                  >
                    {copiedEmail ? (
                      <Check className="w-3 h-3 text-[#38BDF8]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-between gap-2">
                  <a
                    href={PROFILE.phoneHref}
                    className="flex items-center gap-2 text-xs font-mono text-white hover:text-[#38BDF8] transition-colors truncate"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span className="truncate">{PROFILE.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white shrink-0"
                  >
                    {copiedPhone ? (
                      <Check className="w-3 h-3 text-[#38BDF8]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center gap-3">
                  <a
                    href={PROFILE.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-lg bg-white p-1 shrink-0 border border-white/20 hover:scale-105 transition-transform"
                  >
                    <img
                      src={PROFILE.instagramQrPath}
                      alt="Instagram QR code for @john6260wick"
                      className="w-full h-full object-contain rounded"
                    />
                  </a>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[11px] font-mono text-[#38BDF8]">
                      Instagram QR · {PROFILE.instagramHandle}
                    </p>
                    <p className="text-xs font-medium text-white">Scan or tap to follow</p>
                    <a
                      href={PROFILE.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-white/70 hover:text-white truncate block"
                    >
                      @john6260wick
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>GitHub</span>
                </a>
                <a
                  href={PROFILE.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-white transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Facebook</span>
                </a>
                <a
                  href={PROFILE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-white transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Instagram</span>
                </a>
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#38BDF8] text-[#070912] text-xs font-semibold hover:bg-[#7DD3FC] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14]">
              {contactSent ? (
                <div className="space-y-3 py-2">
                  <h3 className="font-display text-lg font-bold text-white">Message Ready</h3>
                  <p className="text-xs sm:text-sm text-[#B4BAC6]">
                    Thank you, {senderName}. Open your email client below to send directly to{' '}
                    {PROFILE.email}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(
                        `Portfolio Inquiry from ${senderName}`
                      )}&body=${encodeURIComponent(`${senderMsg}\n\nReply to: ${senderEmail}`)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38BDF8] text-[#070912] text-xs font-semibold"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open Mail App</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSent(false);
                        setSenderName('');
                        setSenderEmail('');
                        setSenderMsg('');
                      }}
                      className="px-4 py-2 rounded-xl border border-white/15 text-xs text-white/80 hover:bg-white/10"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      aria-label="Your name"
                      className="px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-xs sm:text-sm text-white placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                    />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="Your email"
                      aria-label="Your email"
                      className="px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-xs sm:text-sm text-white placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={senderMsg}
                    onChange={(e) => setSenderMsg(e.target.value)}
                    placeholder="Tell Jashed about an opportunity, internship, or project..."
                    aria-label="Message"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-xs sm:text-sm text-white placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none resize-none"
                  />
                  {contactError && <p className="text-xs text-rose-400">{contactError}</p>}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#070912] text-xs font-semibold hover:bg-[#38BDF8] transition-colors min-h-[40px]"
                    >
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
          <span>© 2026 Md. Ahsanul Haque Jashed</span>
          <span className="font-mono">Chittagong, Bangladesh</span>
        </footer>
      </div>

      {/* =========================================================
          PROJECT DETAIL POPUP (Glassmorphism Modal)
      ========================================================= */}
      {popupProject && (
        <div
          className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPopupProject(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={popupProject.title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#101422]/85 backdrop-blur-2xl border border-white/[0.2] shadow-[0_32px_90px_rgba(0,0,0,0.75)] p-5 sm:p-7 space-y-5 text-[#F4F5F7]"
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.1]">
              <div>
                <p className="text-xs font-mono text-[#38BDF8]">
                  {popupProject.categoryLabel} · {popupProject.statusLabel} ·{' '}
                  <span className="tabular-nums">{popupProject.year}</span>
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                  {popupProject.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A1A7B3] mt-0.5">
                  {popupProject.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPopupProject(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center text-white shrink-0"
                aria-label="Close project detail popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Screenshot Gallery */}
            <div className="space-y-2.5">
              <div className="rounded-2xl overflow-hidden border border-white/[0.12] bg-[#060911] max-h-[300px] flex items-center justify-center">
                <img
                  src={popupImages[popupImageIndex]}
                  alt={popupProject.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[300px] object-contain"
                />
              </div>
              {popupImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {popupImages.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setPopupImageIndex(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border shrink-0 ${
                        popupImageIndex === i
                          ? 'border-[#38BDF8]'
                          : 'border-white/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] space-y-1.5">
                <h4 className="text-xs font-mono text-[#38BDF8]">01. Problem &amp; Context</h4>
                <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                  {popupProject.problem}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] space-y-1.5">
                <h4 className="text-xs font-mono text-[#38BDF8]">02. Architecture</h4>
                <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                  {popupProject.architecture}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] space-y-2">
              <h4 className="text-xs font-mono text-[#38BDF8]">03. Key Deliverables</h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#D1D5DB]">
                {popupProject.features.map((feat) => (
                  <li key={feat}>· {feat}</li>
                ))}
              </ul>
              <p className="text-xs font-mono text-[#9CA3AF] pt-2 border-t border-white/[0.08]">
                Stack: {popupProject.stack.join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const id = popupProject.id;
                  const title = popupProject.title;
                  setPopupProject(null);
                  openApp(`project:${id}`, title);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.14] text-xs font-medium text-white"
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open in Dedicated Window</span>
              </button>

              <div className="flex items-center gap-2">
                {popupProject.id === 'liquid-morph-player' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPopupProject(null);
                      openApp('music');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#38BDF8] text-[#070912] text-xs font-semibold"
                  >
                    <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Launch Live Audio Player</span>
                  </button>
                )}
                {popupProject.repoUrl && (
                  <a
                    href={popupProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#070912] text-xs font-semibold hover:bg-white/90"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
