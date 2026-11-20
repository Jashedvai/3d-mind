import { useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Globe, RotateCw } from 'lucide-react';
import { PROFILE, PROJECTS } from '../../../data/portfolioData';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { soundEngine } from '../../../audio/soundEngine';

type BrowserPage = 'home' | 'gallery' | 'panelflow' | 'liquidmorph' | 'medicine';

const BOOKMARKS: { id: BrowserPage; label: string; url: string }[] = [
  { id: 'home', label: 'Jashed.dev', url: 'https://jashed.workspace/home' },
  { id: 'gallery', label: 'PC Setup Photos', url: 'https://jashed.workspace/setup-gallery' },
  { id: 'panelflow', label: 'PanelFlow AI V8', url: 'https://jashed.workspace/panelflow-v8' },
  { id: 'liquidmorph', label: 'Liquid Morph', url: 'https://jashed.workspace/liquid-morph' },
  { id: 'medicine', label: 'Medicine Center', url: 'https://jashed.workspace/medicine-pos' },
];

export function BrowserApp() {
  const { openApp } = useWorkspace();
  const [page, setPage] = useState<BrowserPage>('home');
  const [address, setAddress] = useState(BOOKMARKS[0].url);

  const navigate = (next: BrowserPage) => {
    soundEngine.playMouseClick();
    setPage(next);
    const match = BOOKMARKS.find((b) => b.id === next);
    if (match) setAddress(match.url);
  };

  return (
    <div className="h-full flex flex-col bg-[#080B11] text-[#F4F5F7]">
      {/* Browser Toolbar */}
      <div className="p-2.5 border-b border-white/[0.08] bg-[#0C1018] space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="w-8 h-8 rounded-md border border-white/10 inline-flex items-center justify-center text-[#9CA3AF] hover:text-white"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('gallery')}
            className="w-8 h-8 rounded-md border border-white/10 inline-flex items-center justify-center text-[#9CA3AF] hover:text-white"
            aria-label="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => soundEngine.playMouseClick()}
            className="w-8 h-8 rounded-md border border-white/10 inline-flex items-center justify-center text-[#9CA3AF] hover:text-white"
            aria-label="Reload page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#06080D] border border-white/10 text-xs font-mono text-[#D1D5DB]">
            <Globe className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                soundEngine.playKeyClick();
                if (e.key === 'Enter') {
                  if (address.includes('setup')) navigate('gallery');
                  else if (address.includes('panel')) navigate('panelflow');
                  else if (address.includes('liquid')) navigate('liquidmorph');
                  else if (address.includes('medicine')) navigate('medicine');
                  else navigate('home');
                }
              }}
              className="w-full bg-transparent focus:outline-none"
              aria-label="Browser address bar"
            />
          </div>
        </div>

        {/* Bookmarks Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.id}
              type="button"
              onClick={() => navigate(bm.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                page === bm.id
                  ? 'bg-[#38BDF8] text-[#07080B] font-semibold'
                  : 'bg-[#121723] text-[#9CA3AF] hover:text-white'
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rendered Viewport */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        {page === 'home' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono text-[#38BDF8]">JashedNet · Local Workspace Index</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {PROFILE.fullName}
              </h2>
              <p className="text-sm text-[#A1A7B3] leading-relaxed">{PROFILE.bioLead}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECTS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openApp(`project:${p.id}`, p.title)}
                  className="p-4 rounded-xl border border-white/[0.08] bg-[#0D111A] hover:border-[#38BDF8]/50 text-left space-y-1.5 transition-colors"
                >
                  <p className="text-[11px] font-mono text-[#38BDF8]">{p.categoryLabel}</p>
                  <p className="font-display font-semibold text-base">{p.title}</p>
                  <p className="text-xs text-[#9CA3AF] line-clamp-2">{p.summary}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap gap-3">
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F4F5F7] text-[#07080B] text-xs font-semibold hover:bg-[#38BDF8]"
              >
                <span>Open External GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => navigate('gallery')}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium hover:bg-white/[0.05]"
              >
                View Real Setup Photos
              </button>
            </div>
          </div>
        )}

        {page === 'gallery' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono text-[#38BDF8]">Workstation Inspiration</p>
              <h3 className="font-display text-xl font-bold">PC Setup Reference Photos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0D111A]">
                <img
                  src={PROFILE.setupPhotoDark}
                  alt="Dark dual-tower PC setup reference"
                  className="w-full aspect-[4/3] object-cover"
                />
                <p className="p-3 text-xs font-mono text-[#9CA3AF]">
                  Dark Dual-Monitor &amp; Tempered Glass Rig
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0D111A]">
                <img
                  src={PROFILE.setupPhotoNeon}
                  alt="Ambient RGB dual-monitor setup reference"
                  className="w-full aspect-[4/3] object-cover"
                />
                <p className="p-3 text-xs font-mono text-[#9CA3AF]">
                  Ambient Studio Speakers &amp; Mechanical Rig
                </p>
              </div>
            </div>
          </div>
        )}

        {(page === 'panelflow' || page === 'liquidmorph' || page === 'medicine') && (
          (() => {
            const targetId =
              page === 'panelflow'
                ? 'panelflow-ai'
                : page === 'liquidmorph'
                ? 'liquid-morph-player'
                : 'medicine-center-system';
            const proj = PROJECTS.find((p) => p.id === targetId)!;
            return (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-[#38BDF8]">{proj.categoryLabel}</p>
                    <h3 className="font-display text-2xl font-bold">{proj.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => openApp(`project:${proj.id}`, proj.title)}
                    className="px-3.5 py-2 rounded-lg bg-[#38BDF8] text-[#07080B] text-xs font-semibold"
                  >
                    Open Full Case Study
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#05070B]">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full max-h-[340px] object-contain mx-auto"
                  />
                </div>
                <p className="text-sm text-[#D1D5DB] leading-relaxed">{proj.summary}</p>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
