import { useState } from 'react';
import { ArrowUpRight, Facebook, Github, Instagram, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import {
  CAPABILITIES,
  PERSONAL_INTERESTS,
  PROFILE,
} from '../../../data/portfolioData';
import { useWorkspace } from '../../../context/WorkspaceContext';

export function AboutApp() {
  const { openApp } = useWorkspace();
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="p-5 sm:p-7 space-y-8 text-[#F4F5F7]">
      {/* Profile Header + Real Photos */}
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/20 bg-white/[0.06] shrink-0">
          {!imgErr ? (
            <img
              src={PROFILE.portraitPath}
              alt={PROFILE.fullName}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-2xl font-bold text-[#38BDF8]">
              {PROFILE.initials}
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div className="text-xs font-mono text-[#38BDF8]">
            {PROFILE.initials} · Personal Profile
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {PROFILE.fullName}
          </h2>
          <p className="text-sm text-[#D1D5DB]">{PROFILE.role}</p>
          <p className="text-xs font-mono text-[#A78BFA]">{PROFILE.education}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              {PROFILE.location}
            </span>
            <span aria-hidden="true">·</span>
            <span>{PROFILE.email}</span>
            <span aria-hidden="true">·</span>
            <a href={PROFILE.phoneHref} className="inline-flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-[#38BDF8]" aria-hidden="true" />
              <span>{PROFILE.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Real Photo Gallery */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl overflow-hidden border border-white/[0.15] bg-white/[0.05] aspect-[4/3]">
          <img
            src={PROFILE.portraitPath}
            alt="Md. Ahsanul Haque Jashed golden-hour portrait"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/[0.15] bg-white/[0.05] aspect-[4/3]">
          <img
            src={PROFILE.portraitCampus}
            alt="Jashed at Chittagong Polytechnic Institute campus"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/[0.15] bg-white/[0.05] aspect-[4/3]">
          <img
            src={PROFILE.setupPhotoDark}
            alt="Jashed dual-monitor studio workstation"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Bio Lead & Philosophy (Glassmorphic Card) */}
      <div className="p-5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] space-y-3">
        <p className="font-display text-lg font-semibold text-white">{PROFILE.bioHeadline}</p>
        <p className="text-sm text-[#D1D5DB] leading-relaxed">{PROFILE.bioLead}</p>
        <p className="text-xs italic text-[#A1A7B3] pt-2 border-t border-white/[0.08]">
          “{PROFILE.philosophy}”
        </p>
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openApp('projects')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#070912] text-xs font-semibold hover:bg-[#38BDF8] transition-colors min-h-[38px]"
          >
            <span>Open Projects</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => openApp('resume')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs font-medium text-white hover:bg-white/[0.12] transition-colors min-h-[38px]"
          >
            <span>View Resume</span>
          </button>
          <button
            type="button"
            onClick={() => openApp('contact')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs font-medium text-white hover:bg-white/[0.12] transition-colors min-h-[38px]"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Contact</span>
          </button>
        </div>
      </div>

      {/* Engineering Differentiators */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#9CA3AF]">Engineering Differentiators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROFILE.differentiators.map((diff) => (
            <div
              key={diff.title}
              className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-1.5"
            >
              <p className="font-display text-sm font-semibold text-white">{diff.title}</p>
              <p className="text-xs text-[#A1A7B3] leading-relaxed">{diff.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Interests */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#9CA3AF]">Personal Interests &amp; Creative Craft</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONAL_INTERESTS.map((interest) => (
            <div
              key={interest.id}
              className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#38BDF8]">
                <span>{interest.tag}</span>
                <Sparkles className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
              </div>
              <p className="font-display text-sm font-semibold text-white">{interest.title}</p>
              <p className="text-xs text-[#A1A7B3] leading-relaxed">{interest.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-[#9CA3AF]">Capabilities Matrix</h3>
        <div className="border-t border-white/[0.1]">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={cap.area}
              className="py-3.5 border-b border-white/[0.1] grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-baseline text-sm"
            >
              <div className="sm:col-span-3 font-medium text-white">
                <span className="font-mono text-xs text-[#6E7685] mr-2 tabular-nums">
                  0{idx + 1}
                </span>
                {cap.area}
              </div>
              <div className="sm:col-span-4 text-[#38BDF8] font-medium">{cap.focus}</div>
              <div className="sm:col-span-5 text-xs text-[#B4BAC6] leading-relaxed">
                {cap.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.1]">
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.05] text-xs text-white/85 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <Github className="w-3.5 h-3.5" aria-hidden="true" />
          <span>GitHub</span>
        </a>
        <a
          href={PROFILE.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.05] text-xs text-white/85 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Facebook</span>
        </a>
        <a
          href={PROFILE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.05] text-xs text-white/85 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Instagram ({PROFILE.instagramHandle})</span>
        </a>
      </div>
    </div>
  );
}
