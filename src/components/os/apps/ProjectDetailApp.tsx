import { useState } from 'react';
import { ArrowLeft, ExternalLink, Terminal } from 'lucide-react';
import { PROJECTS } from '../../../data/portfolioData';
import { useWorkspace } from '../../../context/WorkspaceContext';

export function ProjectDetailApp({ projectId }: { projectId: string }) {
  const { openApp } = useWorkspace();
  const project = PROJECTS.find((p) => p.id === projectId) || PROJECTS[0];
  const images = project.gallery && project.gallery.length > 0 ? project.gallery : [project.image];
  const [selectedImg, setSelectedImg] = useState(0);

  return (
    <div className="p-5 sm:p-7 space-y-6 text-[#F4F5F7]">
      {/* Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => openApp('projects')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9CA3AF] hover:text-[#38BDF8] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
          <span className="text-[#38BDF8]">{project.categoryLabel}</span>
          <span>·</span>
          <span>{project.statusLabel}</span>
          <span>·</span>
          <span className="tabular-nums">{project.year}</span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{project.title}</h2>
        <p className="text-sm text-[#A1A7B3]">{project.subtitle}</p>
      </div>

      {/* Screenshot Showcase */}
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07090E] max-h-[360px] flex items-center justify-center">
          <img
            src={images[selectedImg]}
            alt={`${project.title} view ${selectedImg + 1}`}
            referrerPolicy="no-referrer"
            className="w-full max-h-[360px] object-contain"
          />
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((imgSrc, idx) => (
              <button
                key={imgSrc}
                type="button"
                onClick={() => setSelectedImg(idx)}
                className={`w-20 h-14 rounded-lg overflow-hidden border transition-colors shrink-0 ${
                  selectedImg === idx ? 'border-[#38BDF8]' : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={`Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overview & Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-[#38BDF8]">01. Overview</h3>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{project.summary}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-[#38BDF8]">02. Key Features</h3>
          <ul className="space-y-1.5 text-sm text-[#A1A7B3]">
            {project.features.map((f) => (
              <li key={f} className="leading-relaxed">
                · {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Problem / Architecture / Outcome */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-4">
        <div className="space-y-1">
          <h4 className="text-xs font-mono text-[#9CA3AF]">Problem Context</h4>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{project.problem}</p>
        </div>
        <div className="space-y-1 pt-3 border-t border-white/[0.08]">
          <h4 className="text-xs font-mono text-[#9CA3AF]">Architecture</h4>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{project.architecture}</p>
        </div>
        <div className="space-y-1 pt-3 border-t border-white/[0.08]">
          <h4 className="text-xs font-mono text-[#9CA3AF]">Outcome &amp; Demo Availability</h4>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{project.outcome}</p>
          <p className="text-xs font-mono text-[#38BDF8] pt-1">{project.demoNotes}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#9CA3AF]">
          Tech: {project.stack.join(' · ')}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.id === 'liquid-morph-player' && (
            <button
              type="button"
              onClick={() => openApp('music')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#38BDF8] text-[#07080B] text-xs font-semibold hover:bg-[#7DD3FC] transition-colors min-h-[38px]"
            >
              <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Launch Audio Player</span>
            </button>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/15 text-xs font-medium text-[#F4F5F7] hover:bg-white/[0.06] transition-colors min-h-[38px]"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
