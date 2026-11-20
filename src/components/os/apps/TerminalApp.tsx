import { FormEvent, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  JOURNEY_MILESTONES,
  NOW_BUILDING,
  PROFILE,
  PROJECTS,
} from '../../../data/portfolioData';
import { AppId, useWorkspace } from '../../../context/WorkspaceContext';
import { soundEngine } from '../../../audio/soundEngine';

interface TerminalEntry {
  id: number;
  command?: string;
  lines: string[];
}

const KNOWN_COMMANDS = [
  'help',
  'whoami',
  'about',
  'projects',
  'skills',
  'journey',
  'now',
  'contact',
  'clear',
  'open',
  'audio',
  'neofetch',
  'room',
];

export function TerminalApp() {
  const {
    openApp,
    exitToRoom,
    lastTypedKey,
    showVirtualKeyboard,
    setShowVirtualKeyboard,
    activeWindowId,
  } = useWorkspace();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 1,
      lines: [
        'JashedOS Workspace Shell v2.4 (Bangladesh)',
        'Type `help` for commands, `now` for active builds, or `open <app>`.',
      ],
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handledKeyTs = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    if (!trimmed) return;
    setHistory((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);

    if (cmd === 'clear') {
      setEntries([]);
      return;
    }

    let output: string[] = [];

    if (cmd === 'help') {
      output = [
        'Available commands:',
        '  whoami / about   Show developer profile & CST background',
        '  projects         List all 8 portfolio projects & status',
        '  now              Show active builds & current tasks',
        '  skills           Display engineering & AI toolkit',
        '  journey          Print all 10 development milestones',
        '  contact          Show email & social links',
        '  open <app>       Launch window (about, projects, journey, now, music, terminal, contact, settings)',
        '  audio on|off     Toggle ambient headphone soundtrack',
        '  neofetch         Workspace system summary',
        '  room             Exit desktop back to 3D Studio Room',
        '  clear            Clear terminal output',
      ];
    } else if (cmd === 'about' || cmd === 'whoami') {
      output = [
        `Name:      ${PROFILE.fullName}`,
        `Education: ${PROFILE.education}`,
        `Role:      ${PROFILE.role}`,
        `Location:  ${PROFILE.location}`,
        `Focus:     ${PROFILE.focusAreas.join(' · ')}`,
      ];
    } else if (cmd === 'projects') {
      output = [
        'Projects in Workspace:',
        ...PROJECTS.map(
          (p, i) =>
            `  0${i + 1}. ${p.title.padEnd(32, ' ')} [${p.statusLabel}]`
        ),
        'Tip: run `open projects` to view screenshots & full case studies.',
      ];
    } else if (cmd === 'now') {
      output = [
        'Currently Building:',
        ...NOW_BUILDING.map(
          (n) => `  · ${n.title} (${n.progress}%) — ${n.activeTasks[0]}`
        ),
        'Tip: run `open now` to open the full Now Building board.',
      ];
    } else if (cmd === 'skills') {
      output = [
        'Languages:  TypeScript / JavaScript, Python, Java / Kotlin, SQL',
        'Frontend:   React, Vite, Three.js / WebGL, Tailwind CSS, Web Audio API',
        'Systems/AI: Android, Node.js, SQLite / PostgreSQL, OCR & Computer Vision',
      ];
    } else if (cmd === 'journey') {
      output = JOURNEY_MILESTONES.map((m) => `  ${m.index}. ${m.title} — ${m.summary}`);
    } else if (cmd === 'contact') {
      output = [
        `Email:     ${PROFILE.email}`,
        `Phone:     ${PROFILE.phone}`,
        `GitHub:    ${PROFILE.github}`,
        `Facebook:  ${PROFILE.facebook}`,
        `Instagram: ${PROFILE.instagram}`,
      ];
    } else if (cmd === 'neofetch') {
      output = [
        '       ___    __ __     __   ',
        '      / _ |  / // /__  / /   JashedOS v2.4',
        '     / __ | / _  / _ \\/ /    Host: 3D Developer Room',
        '    /_/ |_|/_//_/\\___/_/     Owner: Md. Ahsanul Haque Jashed',
        '                             Shell: Interactive Workspace CLI',
      ];
    } else if (cmd === 'audio') {
      if (arg === 'on') {
        soundEngine.startMusic();
        output = ['Ambient headphone soundtrack started.'];
      } else if (arg === 'off') {
        soundEngine.stopMusic();
        output = ['Ambient headphone soundtrack paused.'];
      } else {
        output = ['Usage: audio on | audio off'];
      }
    } else if (cmd === 'room' || cmd === 'desk' || cmd === 'exit') {
      exitToRoom();
      return;
    } else if (cmd === 'open') {
      const validApps: Record<string, AppId> = {
        about: 'about',
        projects: 'projects',
        skills: 'skills',
        journey: 'journey',
        now: 'now',
        terminal: 'terminal',
        contact: 'contact',
        browser: 'browser',
        explorer: 'explorer',
        music: 'music',
        notepad: 'notepad',
        resume: 'resume',
        settings: 'settings',
      };
      const target = validApps[arg];
      if (target) {
        openApp(target);
        output = [`Launching ${arg}...`];
      } else {
        output = [
          `Unknown app "${arg}". Try: about, projects, skills, journey, now, music, notepad, browser, explorer, resume, settings, contact.`,
        ];
      }
    } else if (cmd === 'date') {
      output = [new Date().toString()];
    } else if (cmd === 'echo') {
      output = [parts.slice(1).join(' ')];
    } else {
      output = [`Command not found: ${cmd}. Type \`help\` for available commands.`];
    }

    setEntries((prev) => [...prev, { id: Date.now(), command: trimmed, lines: output }]);
  };

  // Receive clicks from Virtual On-Screen Keyboard when Terminal is focused
  useEffect(() => {
    if (!lastTypedKey || lastTypedKey.ts === handledKeyTs.current) return;
    if (activeWindowId !== 'terminal') return;
    handledKeyTs.current = lastTypedKey.ts;

    const k = lastTypedKey.key;
    if (k === 'Enter') {
      const curr = input;
      setInput('');
      runCommand(curr);
    } else if (k === 'Backspace') {
      setInput((prev) => prev.slice(0, -1));
    } else if (k === 'Space') {
      setInput((prev) => prev + ' ');
    } else if (k.length === 1) {
      setInput((prev) => prev + k);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTypedKey, activeWindowId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = input;
    setInput('');
    runCommand(val);
  };

  return (
    <div
      className="h-full flex flex-col bg-[#06080D] text-[#E5E7EB] font-mono text-xs sm:text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Quick Command Strip */}
      <div className="px-4 py-2 border-b border-white/[0.08] bg-[#0A0D14] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {['help', 'whoami', 'projects', 'now', 'journey', 'open music'].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playKeyClick(true);
                runCommand(quick);
              }}
              className="px-2.5 py-1 rounded bg-[#141925] hover:bg-[#1E2638] text-[11px] text-[#9CA3AF] hover:text-[#38BDF8] transition-colors"
            >
              {quick}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowVirtualKeyboard((v) => !v);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
            showVirtualKeyboard
              ? 'bg-[#38BDF8] text-[#07080B] font-semibold'
              : 'bg-[#141925] text-[#9CA3AF] hover:text-white'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Virtual KB</span>
        </button>
      </div>

      {/* Terminal Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1">
            {entry.command && (
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <span>jashed@workspace:~$</span>
                <span className="text-[#F4F5F7]">{entry.command}</span>
              </div>
            )}
            {entry.lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap text-[#A1A7B3] leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        ))}

        {/* Live Prompt Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-[#38BDF8] shrink-0">jashed@workspace:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              soundEngine.playKeyClick(e.key.length > 1);
              if (e.key === 'Tab') {
                e.preventDefault();
                const match = KNOWN_COMMANDS.find((c) => c.startsWith(input.toLowerCase()));
                if (match) setInput(match);
              } else if (e.key === 'ArrowUp' && history.length > 0) {
                e.preventDefault();
                const next = Math.min(historyIdx + 1, history.length - 1);
                setHistoryIdx(next);
                setInput(history[next]);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = historyIdx - 1;
                if (next < 0) {
                  setHistoryIdx(-1);
                  setInput('');
                } else {
                  setHistoryIdx(next);
                  setInput(history[next]);
                }
              }
            }}
            placeholder="type a command (Tab to complete)..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-[#F4F5F7] placeholder:text-[#4B5563] focus:outline-none caret-[#38BDF8]"
          />
        </form>
      </div>
    </div>
  );
}
