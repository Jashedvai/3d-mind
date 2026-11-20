import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { AMBIENT_TRACKS, soundEngine } from '../../../audio/soundEngine';
import { useWorkspace } from '../../../context/WorkspaceContext';

type VisualMode = 'LIQUID' | 'FLOW' | '3D' | 'WAVE';

export function MusicApp() {
  const { audioState } = useWorkspace();
  const [visualMode, setVisualMode] = useState<VisualMode>('LIQUID');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const track = AMBIENT_TRACKS[audioState.trackIndex] || AMBIENT_TRACKS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const { bass, bars } = soundEngine.getAudioLevels();
      const energy = audioState.musicPlaying ? 0.28 + bass * (0.45 + audioState.bassBoost * 0.65) : 0.1;
      phase += audioState.musicPlaying ? 0.035 + bass * 0.06 : 0.012;

      const cx = w / 2;
      const cy = h / 2;

      // Background radial glow
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.45);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      glow.addColorStop(0.5, 'rgba(129, 140, 248, 0.12)');
      glow.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      if (visualMode === 'LIQUID' || visualMode === '3D') {
        const rings = visualMode === '3D' ? 3 : 2;
        for (let r = 0; r < rings; r++) {
          ctx.beginPath();
          const baseRadius = (52 + r * 14) * (1 + energy * 0.28);
          const pts = 48;
          for (let i = 0; i <= pts; i++) {
            const angle = (i / pts) * Math.PI * 2;
            const wave =
              Math.sin(angle * 3 + phase + r) * (6 + energy * 16) +
              Math.cos(angle * 5 - phase * 1.3) * (4 + energy * 10);
            const rad = baseRadius + wave;
            const x = cx + Math.cos(angle) * rad;
            const y = cy + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = r === 0 ? '#38BDF8' : r === 1 ? '#A855F7' : '#818CF8';
          ctx.lineWidth = r === 0 ? 2.5 : 1.5;
          ctx.stroke();
        }
      } else if (visualMode === 'WAVE' || visualMode === 'FLOW') {
        const lines = visualMode === 'FLOW' ? 3 : 1;
        for (let l = 0; l < lines; l++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 4) {
            const norm = x / w;
            const amp = (14 + energy * 42) * Math.sin(norm * Math.PI);
            const y =
              cy +
              Math.sin(norm * 10 + phase * 1.4 + l * 0.8) * amp +
              Math.cos(norm * 18 - phase) * (amp * 0.35);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = l === 0 ? '#38BDF8' : l === 1 ? '#818CF8' : '#C084FC';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }

      // Subtle spectrum bars along bottom
      const barWidth = w / 16;
      bars.forEach((val, i) => {
        const bh = Math.max(3, val * 28);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(i * barWidth + 4, h - bh - 4, barWidth - 8, bh);
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [visualMode, audioState.musicPlaying, audioState.bassBoost]);

  return (
    <div className="p-5 sm:p-6 space-y-5 bg-[#070910] text-[#F4F5F7] h-full flex flex-col justify-between">
      {/* Header inspired by Liquid Morph screenshot */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono tracking-wider text-[#38BDF8]">
            LIQUID MORPH · HEADPHONE AUDIO
          </p>
          <h2 className="font-display text-xl font-bold mt-0.5">{track.title}</h2>
          <p className="text-xs text-[#9CA3AF]">
            {track.artist} · {track.bpm} BPM
          </p>
        </div>

        <button
          type="button"
          onClick={() => soundEngine.setMuted(!audioState.muted)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs hover:bg-white/[0.06] min-h-[38px]"
          aria-label={audioState.muted ? 'Unmute audio' : 'Mute audio'}
        >
          {audioState.muted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#38BDF8]" />
          )}
          <span>{audioState.muted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Real-time Canvas Visualizer */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#05070C] overflow-hidden flex items-center justify-center">
        <canvas ref={canvasRef} width={440} height={190} className="w-full h-[180px]" />
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playMouseClick();
            soundEngine.prevTrack();
          }}
          className="w-11 h-11 rounded-full border border-white/15 inline-flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          aria-label="Previous track"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => soundEngine.toggleMusic()}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#818CF8] text-[#07080B] inline-flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label={audioState.musicPlaying ? 'Pause music' : 'Play music'}
        >
          {audioState.musicPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playMouseClick();
            soundEngine.nextTrack();
          }}
          className="w-11 h-11 rounded-full border border-white/15 inline-flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          aria-label="Next track"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Mode + Bass Energy + Master Volume */}
      <div className="space-y-4 pt-2 border-t border-white/[0.08]">
        <div className="space-y-2">
          <p className="text-[11px] font-mono text-[#9CA3AF]">VISUAL MODE</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(['LIQUID', 'FLOW', '3D', 'WAVE'] as VisualMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  soundEngine.playMouseClick();
                  setVisualMode(m);
                }}
                className={`py-2 rounded-lg text-xs font-mono transition-colors ${
                  visualMode === m
                    ? 'bg-[#38BDF8] text-[#07080B] font-semibold'
                    : 'bg-[#101521] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#9CA3AF]">BASS ENERGY</span>
              <span className="text-[#38BDF8] tabular-nums">
                {Math.round(audioState.bassBoost * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audioState.bassBoost * 100)}
              onChange={(e) => soundEngine.setBassBoost(Number(e.target.value) / 100)}
              className="w-full accent-[#38BDF8]"
            />
          </label>

          <label className="space-y-1.5 block">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#9CA3AF]">MASTER VOLUME</span>
              <span className="text-[#38BDF8] tabular-nums">
                {Math.round(audioState.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audioState.volume * 100)}
              onChange={(e) => soundEngine.setVolume(Number(e.target.value) / 100)}
              className="w-full accent-[#38BDF8]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
