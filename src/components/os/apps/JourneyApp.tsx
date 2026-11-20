import { useEffect, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { JOURNEY_MILESTONES } from '../../../data/portfolioData';
import { isWebGLAvailable } from '../../../three/webglUtils';
import {
  JourneyStaircaseController,
  mountJourneyStaircaseScene,
} from '../../../three/journeyStaircaseScene';

export function JourneyApp() {
  const [selected, setSelected] = useState(0);
  const [webglFailed, setWebglFailed] = useState<boolean>(() => !isWebGLAvailable());
  const [use2DFallback, setUse2DFallback] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<JourneyStaircaseController | null>(null);

  const active = JOURNEY_MILESTONES[selected];
  const show3D = !webglFailed && !use2DFallback && isDesktopViewport;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktopViewport(e.matches);
    setIsDesktopViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !show3D) return;

    try {
      const controller = mountJourneyStaircaseScene({
        container: host,
        initialIndex: selected,
        onSelectMilestone: (idx) => setSelected(idx),
        onContextLost: () => setWebglFailed(true),
      });
      controllerRef.current = controller;
      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    } catch {
      setWebglFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show3D]);

  useEffect(() => {
    controllerRef.current?.selectMilestone(selected);
  }, [selected]);

  return (
    <div className="p-5 sm:p-6 space-y-5 text-[#F4F5F7]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.1]">
        <div>
          <p className="text-xs font-mono text-[#38BDF8]">
            01 — {String(JOURNEY_MILESTONES.length).padStart(2, '0')} Interactive Progression
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            3D Development Journey
          </h2>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {!webglFailed && (
            <button
              type="button"
              onClick={() => setUse2DFallback((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/[0.06] text-xs font-mono text-[#D1D5DB] hover:bg-white/[0.12] min-h-[36px]"
            >
              {show3D ? <Layers className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
              <span>{show3D ? '2D Steps' : '3D Staircase'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelected((i) => Math.max(0, i - 1))}
            disabled={selected === 0}
            className="w-9 h-9 rounded-xl border border-white/15 bg-white/[0.06] inline-flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-35"
            aria-label="Previous milestone"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelected((i) => Math.min(JOURNEY_MILESTONES.length - 1, i + 1))}
            disabled={selected === JOURNEY_MILESTONES.length - 1}
            className="w-9 h-9 rounded-xl border border-white/15 bg-white/[0.06] inline-flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-35"
            aria-label="Next milestone"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP: Interactive 3D Ascending Staircase + Active Details */}
      <div className="hidden md:block space-y-5">
        {show3D ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.14] bg-[#06080F] h-[280px]">
            <div ref={canvasHostRef} className="w-full h-full" />
            <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded bg-[#07090E]/85 border border-white/10 text-[11px] font-mono text-[#9CA3AF] pointer-events-none">
              Drag to orbit · Click any 3D step
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12]">
            <div className="grid grid-cols-10 gap-1.5 items-end h-[180px]">
              {JOURNEY_MILESTONES.map((m, idx) => {
                const isSelected = idx === selected;
                const heightPct = 28 + idx * 7.5;
                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => setSelected(idx)}
                    style={{
                      height: `${heightPct}%`,
                      borderColor: isSelected ? m.accentHex : undefined,
                    }}
                    className={`rounded-t-lg border transition-all p-1.5 flex flex-col justify-between text-left ${
                      isSelected
                        ? 'bg-white/15'
                        : 'bg-white/[0.04] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: isSelected ? m.accentHex : '#6E7685' }}
                    >
                      {m.index}
                    </span>
                    <span className="text-[10px] font-medium text-[#D1D5DB] truncate">
                      {m.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Step Selector Strip (01–10) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {JOURNEY_MILESTONES.map((m, idx) => {
            const isSelected = idx === selected;
            return (
              <button
                key={m.index}
                type="button"
                onClick={() => setSelected(idx)}
                style={{
                  borderColor: isSelected ? m.accentHex : undefined,
                  backgroundColor: isSelected ? `${m.accentHex}24` : undefined,
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors shrink-0 ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'border-white/12 bg-white/[0.04] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {m.index} · {m.title}
              </button>
            );
          })}
        </div>

        {/* Active Milestone Glass Details */}
        <div className="p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span style={{ color: active.accentHex }}>
              Step {active.index} · {active.phase}
            </span>
            <span className="text-[#9CA3AF]">{active.technologies.join(' · ')}</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold">{active.title}</h3>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{active.summary}</p>

          <ul className="space-y-2 pt-3 border-t border-white/[0.08] text-sm text-[#B4BAC6]">
            {active.highlights.map((h) => (
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
            className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <span style={{ color: m.accentHex }} className="font-semibold tabular-nums">
                Step {m.index} · {m.phase}
              </span>
              <span className="text-[#9CA3AF] truncate">{m.technologies.join(' · ')}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">{m.title}</h3>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">{m.summary}</p>
            <ul className="space-y-1 pt-2 border-t border-white/[0.08] text-xs text-[#9CA3AF]">
              {m.highlights.map((h) => (
                <li key={h}>· {h}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
