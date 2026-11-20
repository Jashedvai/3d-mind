import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

const ROWS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', 'Backspace'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'Enter'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '/', 'Space'],
];

export function VirtualKeyboard() {
  const { showVirtualKeyboard, setShowVirtualKeyboard, triggerVirtualKey } = useWorkspace();
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!showVirtualKeyboard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setPressedKey(k);
    };
    const onKeyUp = () => setPressedKey(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [showVirtualKeyboard]);

  if (!showVirtualKeyboard) return null;

  const handlePress = (key: string) => {
    setPressedKey(key);
    triggerVirtualKey(key);
    setTimeout(() => setPressedKey(null), 130);
  };

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[95] w-[min(680px,96vw)] rounded-[22px] border border-white/[0.22] bg-[#101422]/65 backdrop-blur-3xl backdrop-saturate-150 p-2.5 sm:p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_26px_70px_rgba(0,0,0,0.7)]"
      role="region"
      aria-label="Virtual mechanical keyboard"
    >
      <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-mono text-[#9CA3AF]">
        <span>Mechanical Key Deck · Click keys or use physical keyboard</span>
        <button
          type="button"
          onClick={() => setShowVirtualKeyboard(false)}
          className="w-7 h-7 rounded inline-flex items-center justify-center hover:bg-white/10 text-[#9CA3AF] hover:text-white"
          aria-label="Hide virtual keyboard"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isPressed = pressedKey === key;
              const isWide = key === 'Backspace' || key === 'Enter' || key === 'Space';
              const label =
                key === 'Backspace'
                  ? 'Del'
                  : key === 'Space'
                  ? 'Space'
                  : key === 'Enter'
                  ? 'Enter'
                  : key.toUpperCase();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePress(key)}
                  className={`h-9 sm:h-10 rounded-md border font-mono text-xs transition-transform select-none ${
                    isWide ? 'px-2.5 sm:px-4 min-w-[54px] sm:min-w-[74px]' : 'flex-1 max-w-[46px]'
                  } ${
                    isPressed
                      ? 'translate-y-0.5 bg-[#38BDF8] text-[#07080B] border-[#38BDF8] font-bold'
                      : 'bg-[#141925] text-[#E5E7EB] border-white/10 hover:border-white/25 hover:bg-[#1B2232]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
