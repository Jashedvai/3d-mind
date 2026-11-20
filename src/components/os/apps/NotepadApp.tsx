import { useEffect, useRef, useState } from 'react';
import { Download, Keyboard, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { soundEngine } from '../../../audio/soundEngine';

const DEFAULT_NOTE = `JashedOS Scratchpad
===================
Welcome to my Digital Workspace.
Try typing on your physical keyboard or toggle the Virtual Mechanical Keyboard below!

Quick Notes:
- Building PanelFlow AI V8 & panelcolour Manga Colorizer
- Crafting Liquid Morph audio-reactive visuals
- Exploring 3D interactive web engineering`;

export function NotepadApp() {
  const { lastTypedKey, showVirtualKeyboard, setShowVirtualKeyboard, activeWindowId } =
    useWorkspace();
  const [text, setText] = useState<string>(() => {
    try {
      return localStorage.getItem('jashed_os_notepad') || DEFAULT_NOTE;
    } catch {
      return DEFAULT_NOTE;
    }
  });
  const handledTs = useRef<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('jashed_os_notepad', text);
    } catch {
      // ignore storage errors
    }
  }, [text]);

  useEffect(() => {
    if (!lastTypedKey || lastTypedKey.ts === handledTs.current) return;
    if (activeWindowId !== 'notepad') return;
    handledTs.current = lastTypedKey.ts;

    const k = lastTypedKey.key;
    if (k === 'Enter') setText((t) => t + '\n');
    else if (k === 'Backspace') setText((t) => t.slice(0, -1));
    else if (k === 'Space') setText((t) => t + ' ');
    else if (k.length === 1) setText((t) => t + k);
  }, [lastTypedKey, activeWindowId]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleDownload = () => {
    soundEngine.playMouseClick();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jashed-workspace-note.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#080B11] text-[#F4F5F7]">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#0B0E16] flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
          {words} words · {text.length} chars
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVirtualKeyboard((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
              showVirtualKeyboard
                ? 'bg-[#38BDF8] text-[#07080B] font-semibold'
                : 'bg-[#131824] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Virtual KB</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#131824] text-xs text-[#D1D5DB] hover:text-white"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save .txt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setText('');
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#131824] text-[#9CA3AF] hover:text-rose-400"
            aria-label="Clear notepad"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Editor */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => soundEngine.playKeyClick(e.key.length > 1)}
        placeholder="Start typing..."
        className="flex-1 w-full p-5 bg-[#080B11] text-sm font-mono text-[#E5E7EB] leading-relaxed focus:outline-none resize-none caret-[#38BDF8]"
      />
    </div>
  );
}
