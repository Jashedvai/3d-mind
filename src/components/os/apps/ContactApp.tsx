import { FormEvent, useState } from 'react';
import { Check, Copy, Facebook, Github, Instagram, Mail, Phone, Send } from 'lucide-react';
import { PROFILE } from '../../../data/portfolioData';
import { soundEngine } from '../../../audio/soundEngine';

export function ContactApp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopy = async () => {
    soundEngine.playMouseClick();
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyPhone = async () => {
    soundEngine.playMouseClick();
    try {
      await navigator.clipboard.writeText(PROFILE.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    soundEngine.playWindowOpen();
    setError(null);
    setSent(true);
  };

  return (
    <div className="p-5 sm:p-6 space-y-6 text-[#F4F5F7]">
      <div className="pb-4 border-b border-white/[0.08] space-y-1">
        <p className="text-xs font-mono text-[#38BDF8]">Direct Communication</p>
        <h2 className="font-display text-xl sm:text-2xl font-bold">Let&apos;s Build Something</h2>
      </div>

      {/* Direct Contact Cards (Email + Phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono min-w-0">
            <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <span className="truncate">{PROFILE.email}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/[0.06] text-xs hover:bg-white/[0.12] transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#38BDF8]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] flex items-center justify-between gap-2">
          <a
            href={PROFILE.phoneHref}
            className="flex items-center gap-2 text-xs sm:text-sm font-mono hover:text-[#38BDF8] transition-colors min-w-0"
          >
            <Phone className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <span className="truncate">{PROFILE.phone}</span>
          </a>
          <button
            type="button"
            onClick={handleCopyPhone}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/[0.06] text-xs hover:bg-white/[0.12] transition-colors shrink-0"
          >
            {copiedPhone ? <Check className="w-3.5 h-3.5 text-[#38BDF8]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {sent ? (
        <div className="p-6 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-[#38BDF8]/40 space-y-4">
          <h3 className="font-display text-lg font-bold">Message Ready</h3>
          <p className="text-sm text-[#D1D5DB]">
            Thank you, {name}. Launch your default mail app below to dispatch immediately.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(
                `Workspace Inquiry from ${name}`
              )}&body=${encodeURIComponent(`${message}\n\nReply to: ${email}`)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#38BDF8] text-[#07080B] text-xs font-semibold hover:bg-[#7DD3FC]"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Mail Client</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setName('');
                setEmail('');
                setMessage('');
              }}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-xs text-[#D1D5DB] hover:bg-white/[0.08]"
            >
              New Message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="os-contact-name" className="text-xs font-mono text-[#9CA3AF]">
                Name
              </label>
              <input
                id="os-contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={() => soundEngine.playKeyClick()}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-sm text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="os-contact-email" className="text-xs font-mono text-[#9CA3AF]">
                Email
              </label>
              <input
                id="os-contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={() => soundEngine.playKeyClick()}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-sm text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="os-contact-msg" className="text-xs font-mono text-[#9CA3AF]">
              Message
            </label>
            <textarea
              id="os-contact-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={() => soundEngine.playKeyClick()}
              placeholder="Tell Jashed about your project or idea..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.14] text-sm text-[#F4F5F7] focus:border-[#38BDF8] focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-[#D1D5DB] hover:text-white hover:bg-white/[0.06]"
              >
                <Github className="w-3.5 h-3.5" aria-hidden="true" />
                <span>GitHub</span>
              </a>
              <a
                href={PROFILE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-[#D1D5DB] hover:text-white hover:bg-white/[0.06]"
              >
                <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Facebook</span>
              </a>
              <a
                href={PROFILE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-[#D1D5DB] hover:text-white hover:bg-white/[0.06]"
              >
                <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Instagram</span>
              </a>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#F4F5F7] text-[#07080B] text-xs font-semibold hover:bg-[#38BDF8] transition-colors min-h-[40px]"
            >
              <span>Send Message</span>
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}

      {/* Instagram QR Card */}
      <div className="p-4 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] flex items-center gap-4">
        <a
          href={PROFILE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="w-20 h-20 rounded-xl overflow-hidden bg-white p-1 shrink-0 border border-white/20 hover:scale-105 transition-transform"
        >
          <img
            src={PROFILE.instagramQrPath}
            alt="Instagram QR code for @john6260wick"
            className="w-full h-full object-contain rounded-lg"
          />
        </a>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-mono text-[#38BDF8]">Instagram QR · {PROFILE.instagramHandle}</p>
          <p className="text-sm font-semibold text-white">Scan or tap to connect on Instagram</p>
          <a
            href={PROFILE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white transition-colors"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400" aria-hidden="true" />
            <span className="truncate">instagram.com/john6260wick</span>
          </a>
        </div>
      </div>
    </div>
  );
}
