import { useState } from 'react';
import { Check, Copy, ExternalLink, Printer } from 'lucide-react';
import { COLLABORATIVE_BUILDS, PROFILE, PROJECTS } from '../../../data/portfolioData';
import { soundEngine } from '../../../audio/soundEngine';

export function ResumeApp() {
  const [copied, setCopied] = useState(false);

  const copySummary = async () => {
    soundEngine.playMouseClick();
    const summary = `${PROFILE.fullName} — ${PROFILE.role}\n${PROFILE.location} | ${PROFILE.email} | ${PROFILE.phone}\n${PROFILE.education}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 text-[#F4F5F7]">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/[0.1]">
        <div>
          <h2 className="font-display text-2xl font-bold">{PROFILE.fullName}</h2>
          <p className="text-sm text-[#38BDF8] font-medium mt-0.5">{PROFILE.role}</p>
          <p className="text-xs font-mono text-[#9CA3AF] mt-1">
            {PROFILE.location} · {PROFILE.email} · {PROFILE.phone}
          </p>
          <p className="text-xs font-mono text-[#9CA3AF] mt-1">{PROFILE.education}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs hover:bg-white/[0.12]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#38BDF8]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>
          <a
            href="/assets/aistudio/Md_Ahsanul_Haque_Jashed_CV__1__ccb3f784.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs hover:bg-white/[0.12]"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open PDF</span>
          </a>
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#070912] text-xs font-semibold hover:bg-[#38BDF8]"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print CV</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-mono text-[#38BDF8]">01. Executive Summary</h3>
        <p className="text-sm text-[#D1D5DB] leading-relaxed">{PROFILE.bioLead}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#38BDF8]">02. Key Engineering &amp; Product Projects</h3>
        <div className="space-y-3">
          {PROJECTS.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white/[0.06] border border-white/[0.12] space-y-1.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display font-semibold text-sm text-white">{p.title}</span>
                <span className="text-xs font-mono text-[#9CA3AF]">
                  {p.statusLabel} · <span className="tabular-nums">{p.year}</span>
                </span>
              </div>
              <p className="text-xs text-[#B4BAC6] leading-relaxed">{p.summary}</p>
              <p className="text-[11px] font-mono text-[#38BDF8]">{p.stack.join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#38BDF8]">03. Collaborative &amp; Platform Builds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLLABORATIVE_BUILDS.map((b) => (
            <div
              key={b.title}
              className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-1"
            >
              <p className="font-display text-xs font-semibold text-white">{b.title}</p>
              <p className="text-[11px] text-[#A1A7B3] leading-relaxed">{b.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-mono text-[#38BDF8]">04. Technical Competencies</h3>
        <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed font-mono">
          Kotlin · Python · Java · TypeScript · JavaScript · Dart · SQL · React · Django · Flutter · Riverpod · Three.js · Jetpack Compose · Media3 · YOLOv8 · PaddleOCR · ONNX Runtime · OpenCV · SQLite · MySQL · Supabase · FastAPI
        </p>
      </div>
    </div>
  );
}
