import { useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { ACCENT_COLORS, useWorkspace } from '../context/WorkspaceContext';
import { PROFILE } from '../data/portfolioData';

export function BootScreen() {
  const { skipToDesktop, reducedMotion, accent } = useWorkspace();
  const [progress, setProgress] = useState(12);
  const accentHex = ACCENT_COLORS[accent].hex;

  useEffect(() => {
    if (reducedMotion) {
      setProgress(100);
      const quick = window.setTimeout(() => {
        skipToDesktop();
      }, 300);
      return () => window.clearTimeout(quick);
    }

    const start = performance.now();
    const duration = 1650;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Smooth Apple-style ease curve
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(Math.round(8 + eased * 92));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        skipToDesktop();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, skipToDesktop]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs flex flex-col items-center space-y-8">
        {/* Minimalist Apple-inspired Workspace Emblem */}
        <div className="relative flex flex-col items-center gap-3">
          <svg
            viewBox="0 0 64 64"
            className="w-16 h-16 text-white"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="6"
              y="6"
              width="52"
              height="52"
              rx="15"
              stroke="currentColor"
              strokeWidth="2.5"
              opacity="0.9"
            />
            <path
              d="M22 40C22 44.5 25.5 47 30 47C35 47 38 43.5 38 38V17H43V38C43 46.5 37.5 52 30 52C23.5 52 18 47.8 17.5 41.2L22 40Z"
              fill="currentColor"
            />
            <circle cx="40.5" cy="17" r="3" fill={accentHex} />
          </svg>
          <span className="font-display text-sm tracking-wide text-white/80">
            {PROFILE.osName}
          </span>
        </div>

        {/* Sleek Apple Boot Progress Bar */}
        <div className="w-52 h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => skipToDesktop()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-mono text-white/60 hover:text-white transition-colors"
        >
          <span>Skip</span>
          <SkipForward className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
