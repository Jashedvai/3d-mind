import { ArrowUpRight, CheckCircle2, Compass, Layers } from 'lucide-react';
import { LEARNING_OBJECTIVES, NOW_BUILDING } from '../../../data/portfolioData';
import { useWorkspace } from '../../../context/WorkspaceContext';

export function NowBuildingApp() {
  const { openApp } = useWorkspace();

  return (
    <div className="p-5 sm:p-7 space-y-7 text-[#F4F5F7]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <p className="text-xs font-mono text-[#38BDF8]">Current Work &amp; Roadmap</p>
          <h2 className="font-display text-xl sm:text-2xl font-bold">Now Building</h2>
        </div>
        <button
          type="button"
          onClick={() => openApp('projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-medium text-[#E5E7EB] hover:bg-white/[0.06] transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span>All Projects</span>
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Active Projects */}
      <div className="space-y-4">
        {NOW_BUILDING.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-[#38BDF8]">{item.area}</p>
                <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
              </div>
              <span className="text-xs font-mono text-[#A1A7B3]">
                {item.status} · <span className="text-white tabular-nums">{item.progress}%</span>
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#38BDF8]"
                style={{ width: `${item.progress}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-mono text-[#8B93A3]">Active Tasks</p>
              <ul className="space-y-1.5 text-sm text-[#D1D5DB]">
                {item.activeTasks.map((task) => (
                  <li key={task} className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/[0.08] text-xs font-mono text-[#9CA3AF]">
              Next Milestone: <span className="text-[#38BDF8]">{item.upcoming}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Objectives */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8]">
          <Compass className="w-4 h-4" aria-hidden="true" />
          <span>Current Learning Objectives</span>
        </div>
        <ul className="space-y-2 text-sm text-[#B4BAC6]">
          {LEARNING_OBJECTIVES.map((obj) => (
            <li key={obj}>· {obj}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
