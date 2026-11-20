import { useState } from 'react';
import { ArrowUpRight, ExternalLink, Layers, Terminal, X } from 'lucide-react';
import {
  COLLABORATIVE_BUILDS,
  PROJECTS,
  ProjectCategory,
  ProjectItem,
} from '../../../data/portfolioData';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { soundEngine } from '../../../audio/soundEngine';

const CATEGORIES: ProjectCategory[] = ['All', 'AI & ML', 'Software', 'Android'];

export function ProjectsApp() {
  const { openApp } = useWorkspace();
  const [filter, setFilter] = useState<ProjectCategory>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [popupProject, setPopupProject] = useState<ProjectItem | null>(null);
  const [popupImgIdx, setPopupImgIdx] = useState(0);

  const filtered =
    filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.filterGroup === filter);

  const popupImages = popupProject
    ? popupProject.gallery && popupProject.gallery.length > 0
      ? popupProject.gallery
      : [popupProject.image]
    : [];

  return (
    <div className="p-5 sm:p-6 space-y-6 text-[#F4F5F7]">
      {/* Header + Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.1]">
        <div>
          <p className="text-xs font-mono text-[#38BDF8]">7 Key Engineering Projects</p>
          <h2 className="font-display text-xl sm:text-2xl font-bold">Projects Explorer</h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.12]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                soundEngine.playMouseClick();
                setFilter(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] ${
                filter === cat
                  ? 'bg-white text-[#070912] font-semibold'
                  : 'text-[#A1A7B3] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Seven Project Showcase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((project, idx) => (
          <button
            key={project.id}
            type="button"
            onClick={() => {
              soundEngine.playWindowOpen();
              setPopupProject(project);
              setPopupImgIdx(0);
            }}
            className={`group text-left rounded-2xl border border-white/[0.14] bg-white/[0.06] hover:bg-white/[0.09] hover:border-[#38BDF8]/60 backdrop-blur-xl transition-all overflow-hidden flex flex-col justify-between ${
              idx === 0 && filter === 'All' ? 'sm:col-span-2' : ''
            }`}
          >
            <div
              className={`w-full bg-[#07090E] border-b border-white/[0.08] overflow-hidden ${
                idx === 0 && filter === 'All' ? 'aspect-[16/8]' : 'aspect-[16/10]'
              }`}
            >
              {!brokenImages[project.id] ? (
                <img
                  src={project.image}
                  alt={`${project.title} screenshot`}
                  referrerPolicy="no-referrer"
                  onError={() => setBrokenImages((prev) => ({ ...prev, [project.id]: true }))}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[#9CA3AF]">
                  {project.title}
                </div>
              )}
            </div>

            <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#9CA3AF]">
                  <span className="text-[#38BDF8]">{project.categoryLabel}</span>
                  <span>
                    {project.statusLabel} · <span className="tabular-nums">{project.year}</span>
                  </span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-[#B4BAC6] leading-relaxed line-clamp-2">
                  {project.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#8B93A3]">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.08]">
        {COLLABORATIVE_BUILDS.map((b) => (
          <div
            key={b.title}
            className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#38BDF8]">{b.badge}</span>
              <span className="text-[#9CA3AF] truncate">{b.stack}</span>
            </div>
            <h3 className="font-display text-sm font-bold text-white">{b.title}</h3>
            <p className="text-xs text-[#A1A7B3] leading-relaxed">{b.summary}</p>
          </div>
        ))}
      </div>

      {/* Glassmorphism Project Detail Popup */}
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
            className="w-full max-w-3xl max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#101422]/85 backdrop-blur-2xl border border-white/[0.2] shadow-2xl p-5 sm:p-7 space-y-5 text-[#F4F5F7]"
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
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-2xl overflow-hidden border border-white/[0.12] bg-[#060911] max-h-[300px] flex items-center justify-center">
                <img
                  src={popupImages[popupImgIdx]}
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
                      onClick={() => setPopupImgIdx(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border shrink-0 ${
                        popupImgIdx === i
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
                <h4 className="text-xs font-mono text-[#38BDF8]">Problem</h4>
                <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                  {popupProject.problem}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] space-y-1.5">
                <h4 className="text-xs font-mono text-[#38BDF8]">Architecture</h4>
                <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                  {popupProject.architecture}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] space-y-2">
              <h4 className="text-xs font-mono text-[#38BDF8]">Key Deliverables</h4>
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
                    <span>Launch Audio Player</span>
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
