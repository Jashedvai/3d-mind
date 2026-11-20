import {
  ACCENT_COLORS,
  AccentId,
  useWorkspace,
  WallpaperId,
} from '../../../context/WorkspaceContext';
import { PROFILE } from '../../../data/portfolioData';
import { soundEngine } from '../../../audio/soundEngine';

const WALLPAPERS: { id: WallpaperId; label: string; thumb?: string }[] = [
  { id: 'sonoma', label: 'macOS Aurora' },
  { id: 'obsidian', label: 'Obsidian Grid' },
  { id: 'room-iso', label: 'Periwinkle Studio' },
  { id: 'setup-dark', label: 'Dark PC Rig Photo', thumb: PROFILE.setupPhotoDark },
  { id: 'setup-neon', label: 'Ambient Dual-Monitor Photo', thumb: PROFILE.setupPhotoNeon },
  { id: 'grid', label: 'Architectural Dot Grid' },
];

export function SettingsApp() {
  const {
    wallpaper,
    setWallpaper,
    accent,
    setAccent,
    showVirtualKeyboard,
    setShowVirtualKeyboard,
    reducedMotion,
    setReducedMotion,
    audioState,
  } = useWorkspace();

  return (
    <div className="p-5 sm:p-6 space-y-7 text-[#F4F5F7]">
      <div className="pb-4 border-b border-white/[0.08]">
        <p className="text-xs font-mono text-[#38BDF8]">JashedOS Preferences</p>
        <h2 className="font-display text-xl sm:text-2xl font-bold">Workspace Settings</h2>
      </div>

      {/* Wallpaper Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#9CA3AF]">Desktop Wallpaper</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => {
                soundEngine.playMouseClick();
                setWallpaper(wp.id);
              }}
              className={`rounded-xl border overflow-hidden text-left transition-colors ${
                wallpaper === wp.id
                  ? 'border-[#38BDF8] bg-[#132033]'
                  : 'border-white/10 bg-[#0A0D14] hover:border-white/25'
              }`}
            >
              <div className="h-20 w-full bg-[#07090F] overflow-hidden">
                {wp.thumb ? (
                  <img
                    src={wp.thumb}
                    alt={wp.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full ${
                      wp.id === 'sonoma'
                        ? 'bg-gradient-to-br from-[#312E81] via-[#0F172A] to-[#0891B2]'
                        : wp.id === 'obsidian'
                          ? 'bg-gradient-to-br from-[#0B1222] via-[#07090F] to-[#111827]'
                          : 'bg-[#07090F] bg-[radial-gradient(#38BDF833_1px,transparent_1px)] [background-size:14px_14px]'
                    }`}
                  />
                )}
              </div>
              <div className="p-2.5 text-xs font-medium">{wp.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#9CA3AF]">System &amp; RGB Accent</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.keys(ACCENT_COLORS) as AccentId[]).map((key) => {
            const item = ACCENT_COLORS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  soundEngine.playMouseClick();
                  setAccent(key);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                  accent === key
                    ? 'border-white bg-white/[0.08]'
                    : 'border-white/10 bg-[#0A0D14] hover:border-white/25'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.hex }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound & Input Controls */}
      <div className="space-y-3 pt-2 border-t border-white/[0.08]">
        <h3 className="text-xs font-mono text-[#9CA3AF]">Audio, Motion &amp; Input</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#0A0D14] border border-white/[0.07]">
            <div>
              <p className="text-sm font-medium">Reduced Camera Motion</p>
              <p className="text-xs text-[#6E7685]">Instant room &amp; boot transitions</p>
            </div>
            <button
              type="button"
              onClick={() => setReducedMotion((r) => !r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                reducedMotion
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-[#161B26] text-[#9CA3AF]'
              }`}
            >
              {reducedMotion ? 'Reduced' : 'Standard'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#0A0D14] border border-white/[0.07]">
            <div>
              <p className="text-sm font-medium">Mechanical Keyboard &amp; UI Sounds</p>
              <p className="text-xs text-[#6E7685]">Synthesized tactile clicks &amp; chimes</p>
            </div>
            <button
              type="button"
              onClick={() => soundEngine.setSfxEnabled(!audioState.sfxEnabled)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                audioState.sfxEnabled
                  ? 'bg-[#38BDF8] text-[#07080B]'
                  : 'bg-[#161B26] text-[#9CA3AF]'
              }`}
            >
              {audioState.sfxEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#0A0D14] border border-white/[0.07]">
            <div>
              <p className="text-sm font-medium">Ambient Headphone Soundtrack</p>
              <p className="text-xs text-[#6E7685]">Procedural background synth pad</p>
            </div>
            <button
              type="button"
              onClick={() => soundEngine.toggleMusic()}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                audioState.musicPlaying
                  ? 'bg-[#38BDF8] text-[#07080B]'
                  : 'bg-[#161B26] text-[#9CA3AF]'
              }`}
            >
              {audioState.musicPlaying ? 'Playing' : 'Stopped'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#0A0D14] border border-white/[0.07]">
            <div>
              <p className="text-sm font-medium">On-Screen Mechanical Keyboard</p>
              <p className="text-xs text-[#6E7685]">Interactive key deck for Terminal &amp; Notepad</p>
            </div>
            <button
              type="button"
              onClick={() => setShowVirtualKeyboard((v) => !v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                showVirtualKeyboard
                  ? 'bg-[#38BDF8] text-[#07080B]'
                  : 'bg-[#161B26] text-[#9CA3AF]'
              }`}
            >
              {showVirtualKeyboard ? 'Shown' : 'Hidden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
