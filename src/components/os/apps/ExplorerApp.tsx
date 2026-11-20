import { useState } from 'react';
import { FileCode2, FileImage, FileText, Folder, Music } from 'lucide-react';
import { PROJECTS } from '../../../data/portfolioData';
import { AppId, useWorkspace } from '../../../context/WorkspaceContext';
import { soundEngine } from '../../../audio/soundEngine';

type FolderKey = 'projects' | 'screenshots' | 'docs' | 'audio';

export function ExplorerApp() {
  const { openApp } = useWorkspace();
  const [activeFolder, setActiveFolder] = useState<FolderKey>('projects');

  const folders: { key: FolderKey; label: string; count: number }[] = [
    { key: 'projects', label: 'projects', count: PROJECTS.length },
    { key: 'screenshots', label: 'screenshots', count: 5 },
    { key: 'docs', label: 'documents', count: 3 },
    { key: 'audio', label: 'soundtracks', count: 3 },
  ];

  const handleOpen = (appId: AppId, title?: string) => {
    soundEngine.playMouseClick();
    openApp(appId, title);
  };

  return (
    <div className="h-full flex flex-col sm:flex-row bg-[#080B11] text-[#F4F5F7]">
      {/* Sidebar Folders */}
      <aside className="sm:w-48 border-b sm:border-b-0 sm:border-r border-white/[0.08] bg-[#0B0E16] p-3 flex sm:flex-col gap-1 overflow-x-auto">
        {folders.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setActiveFolder(f.key);
            }}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeFolder === f.key
                ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Folder className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{f.label}</span>
            </span>
            <span className="font-mono text-[10px] opacity-70">{f.count}</span>
          </button>
        ))}
      </aside>

      {/* Main Directory View */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        <div className="text-xs font-mono text-[#6E7685] pb-2 border-b border-white/[0.07]">
          ~/workspace/{activeFolder}
        </div>

        {activeFolder === 'projects' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleOpen(`project:${p.id}`, p.title)}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0D111A] border border-white/[0.07] hover:border-[#38BDF8]/40 text-left transition-colors"
              >
                <FileCode2 className="w-5 h-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{p.title}</p>
                  <p className="text-[11px] font-mono text-[#6E7685] truncate">{p.categoryLabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeFolder === 'screenshots' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROJECTS.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleOpen(`project:${p.id}`, p.title)}
                className="rounded-lg overflow-hidden border border-white/10 bg-[#0D111A] hover:border-[#38BDF8]/50 text-left"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-24 object-cover object-top"
                />
                <div className="p-2 flex items-center gap-1.5 text-[11px] truncate">
                  <FileImage className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <span className="truncate">{p.id}.png</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeFolder === 'docs' && (
          <div className="space-y-2">
            {[
              { name: 'README_JASHED.md', app: 'about' as AppId, desc: 'Developer profile & focus' },
              { name: 'RESUME_2026.pdf', app: 'resume' as AppId, desc: 'Full CV & experience' },
              { name: 'SCRATCHPAD.txt', app: 'notepad' as AppId, desc: 'Live interactive notes' },
            ].map((doc) => (
              <button
                key={doc.name}
                type="button"
                onClick={() => handleOpen(doc.app)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0D111A] border border-white/[0.07] hover:border-[#38BDF8]/40 text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-mono font-medium">{doc.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{doc.desc}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#38BDF8]">Open</span>
              </button>
            ))}
          </div>
        )}

        {activeFolder === 'audio' && (
          <div className="space-y-2">
            {['Midnight Studio Pad', 'Obsidian Terminal Flow', 'Liquid Morph Ambient'].map(
              (track, idx) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => {
                    soundEngine.startMusic(idx);
                    handleOpen('music');
                  }}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0D111A] border border-white/[0.07] hover:border-[#38BDF8]/40 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Music className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                    <span className="text-xs font-medium">{track}.synth</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#38BDF8]">Play</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
