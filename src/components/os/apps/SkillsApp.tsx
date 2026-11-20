import { TOOLKIT_GROUPS } from '../../../data/portfolioData';

export function SkillsApp() {
  return (
    <div className="p-5 sm:p-6 space-y-6 text-[#F4F5F7]">
      <div className="pb-4 border-b border-white/[0.1] space-y-1">
        <p className="text-xs font-mono text-[#38BDF8]">Technical Competencies</p>
        <h2 className="font-display text-xl sm:text-2xl font-bold">Skills &amp; Technology</h2>
        <p className="text-xs sm:text-sm text-[#B4BAC6]">
          Core languages, web &amp; cross-platform frameworks, native Android, applied AI, and databases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLKIT_GROUPS.map((group, gIdx) => (
          <div
            key={group.category}
            className="rounded-2xl border border-white/[0.14] bg-white/[0.06] backdrop-blur-xl p-4 sm:p-5 space-y-4"
          >
            <div className="pb-3 border-b border-white/[0.08]">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  {group.category}
                </h3>
                <span className="text-xs font-mono tabular-nums text-[#8B93A3]">
                  0{gIdx + 1}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">{group.description}</p>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="font-mono text-[#38BDF8] shrink-0">{item.level}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#818CF8]"
                      style={{ width: `${item.ratio}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
