import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Battery,
  BatteryCharging,
  BedDouble,
  Briefcase,
  Code2,
  Mail,
  Monitor,
  Plug,
  PlugZap,
  User,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PROFILE, PROJECTS, TOOLKIT_GROUPS } from '../../data/portfolioData';
import { soundEngine } from '../../audio/soundEngine';

interface InteractivePhoneProps {
  onExitPhone: () => void;
  onToggleOutlet: () => void;
  onGoToBed?: () => void;
}

type PhoneTab = 'home' | 'projects' | 'skills' | 'contact';

/**
 * Standalone Interactive Mobile Phone UI + East Sideboard Wall Outlet Overlay
 * displayed when the camera focuses on the separated Phone Charging Station.
 * Note: Zero backdrop-blur used over the active WebGL canvas.
 */
export function InteractivePhone({
  onExitPhone,
  onToggleOutlet,
  onGoToBed,
}: InteractivePhoneProps) {
  const { phoneCharging, batteryLevel, skipToDesktop } = useWorkspace();
  const [tab, setTab] = useState<PhoneTab>('home');

  const topProjects = PROJECTS.slice(0, 4);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExitPhone}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/15 bg-[#12151c]/95 hover:bg-[#1a1f29] text-xs font-medium text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Room overview</span>
          </button>

          {onGoToBed && (
            <button
              type="button"
              onClick={onGoToBed}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-[#12151c]/95 hover:bg-[#1a1f29] text-xs font-medium text-[#D1D5DB] hover:text-white transition-colors"
            >
              <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Bed view</span>
            </button>
          )}
        </div>

        {/* Virtual Wall Outlet Status & Toggle Card */}
        <button
          type="button"
          onClick={onToggleOutlet}
          className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-mono transition-colors ${
            phoneCharging
              ? 'border-[#22C55E]/60 bg-[#11241a]/95 text-[#86EFAC]'
              : 'border-white/15 bg-[#12151c]/95 text-[#D1D5DB] hover:border-white/30'
          }`}
        >
          {phoneCharging ? (
            <PlugZap className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
          ) : (
            <Plug className="w-4 h-4 text-[#9CA3AF]" aria-hidden="true" />
          )}
          <span>
            Wall outlet: {phoneCharging ? 'Charging' : 'Unplugged'} ({batteryLevel}%)
          </span>
        </button>
      </div>

      {/* Side Mobile Phone Frame + Charging Cable Badge */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-end gap-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[320px] rounded-[28px] border-2 border-white/20 bg-[#0d1016]/96 p-3 shadow-[0_24px_64px_rgba(0,0,0,0.8)] space-y-3">
          {/* Phone Status Bar */}
          <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] font-mono text-white/85">
            <span>10:42</span>
            <div className="w-16 h-3.5 rounded-full bg-black border border-white/10" />
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span>{batteryLevel}%</span>
              {phoneCharging ? (
                <BatteryCharging className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
              ) : (
                <Battery className="w-4 h-4 text-white/75" aria-hidden="true" />
              )}
            </span>
          </div>

          {/* Charging Notification Strip when Wall Outlet is Connected */}
          <div
            className={`px-3 py-2 rounded-xl border text-[11px] font-mono flex items-center justify-between gap-2 ${
              phoneCharging
                ? 'border-[#22C55E]/40 bg-[#12261b] text-[#86EFAC]'
                : 'border-white/10 bg-white/[0.04] text-[#9CA3AF]'
            }`}
          >
            <span>
              {phoneCharging
                ? 'USB-C connected to dock outlet'
                : 'Tap outlet to charge phone'}
            </span>
            <button
              type="button"
              onClick={onToggleOutlet}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
            >
              {phoneCharging ? 'Unplug' : 'Plug in'}
            </button>
          </div>

          {/* Interactive Mobile Portfolio Body */}
          <div className="h-[268px] overflow-y-auto px-1 space-y-3">
            {tab === 'home' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                  <img
                    src={PROFILE.portraitPath}
                    alt={PROFILE.fullName}
                    className="w-12 h-12 rounded-xl object-cover object-top border border-white/15 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {PROFILE.fullName}
                    </h3>
                    <p className="text-[11px] text-[#9CA3AF] truncate">
                      Creative Developer · CST
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#CBD5E1] leading-relaxed px-1">
                  {PROFILE.bioLead}
                </p>

                <button
                  type="button"
                  onClick={() => skipToDesktop('editorial')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#070912] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Full Desktop OS</span>
                </button>
              </div>
            )}

            {tab === 'projects' && (
              <div className="space-y-2">
                {topProjects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => skipToDesktop(`project:${proj.id}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {proj.title}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] line-clamp-2">{proj.summary}</p>
                  </button>
                ))}
              </div>
            )}

            {tab === 'skills' && (
              <div className="space-y-2">
                {TOOLKIT_GROUPS.map((grp) => (
                  <div
                    key={grp.category}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5"
                  >
                    <p className="text-[11px] font-mono text-[#38BDF8]">{grp.category}</p>
                    <p className="text-xs text-white/90">
                      {grp.items.map((item) => item.name).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'contact' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <p className="text-[11px] font-mono text-[#9CA3AF]">Email</p>
                  <p className="text-white font-mono truncate">{PROFILE.email}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <p className="text-[11px] font-mono text-[#9CA3AF]">Phone</p>
                  <p className="text-white font-mono">{PROFILE.phone}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={PROFILE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-center text-white font-medium"
                  >
                    GitHub
                  </a>
                  <a
                    href={PROFILE.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-center text-white font-medium"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Phone Bottom Tab Bar */}
          <nav
            aria-label="Mobile portfolio tabs"
            className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-white/[0.05] border border-white/10"
          >
            {(
              [
                { id: 'home', label: 'Home', icon: User },
                { id: 'projects', label: 'Work', icon: Briefcase },
                { id: 'skills', label: 'Stack', icon: Code2 },
                { id: 'contact', label: 'Contact', icon: Mail },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playMouseClick();
                    setTab(item.id);
                  }}
                  className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                    active ? 'bg-white/15 text-white' : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <p className="text-center text-[10px] font-mono text-white/45">© 2026 Jashed</p>
        </div>
      </div>
    </div>
  );
}
