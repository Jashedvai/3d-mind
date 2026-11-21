import { SoundFX } from './audio';
import { TapRacerEngine, TapRacerSnapshot } from './engine';
import { CanvasRenderer } from './renderer';

export interface TapRacerBridge {
  steerLeft: () => void;
  steerCenter: () => void;
  steerRight: () => void;
  setBoost: (active: boolean) => void;
  toggleMute: () => boolean;
  togglePause: () => boolean;
  restart: () => void;
  destroy: () => void;
}

export interface TapRacerMountHooks {
  reducedMotion?: boolean;
  onStateChange?: (snapshot: TapRacerSnapshot) => void;
}

export function mountTapRacer(
  containerEl: HTMLElement,
  hooks: TapRacerMountHooks = {}
): TapRacerBridge {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:manipulation;';
  containerEl.innerHTML = '';
  containerEl.appendChild(canvas);

  const sfx = new SoundFX();
  const renderer = new CanvasRenderer(canvas);
  const engine = new TapRacerEngine({
    renderer,
    sfx,
    reducedMotion: hooks.reducedMotion ?? false,
    onStateChange: hooks.onStateChange,
  });

  const onPointerDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    engine.steer(tapX < rect.width / 2 ? -1 : 1);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || k === 'a') {
      engine.steer(-1);
    } else if (e.key === 'ArrowRight' || k === 'd') {
      engine.steer(1);
    } else if (k === 'c') {
      engine.center();
    } else if (e.code === 'Space') {
      e.preventDefault();
      engine.setBoost(true);
    } else if (k === 'p') {
      if (engine.state === 'PLAYING') engine.setState('PAUSED');
      else if (engine.state === 'PAUSED') engine.setState('PLAYING');
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      engine.setBoost(false);
    }
  };

  const onResize = () => renderer.resize();
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(containerEl);

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);

  engine.runLoop();

  return {
    steerLeft: () => engine.steer(-1),
    steerCenter: () => engine.center(),
    steerRight: () => engine.steer(1),
    setBoost: (active: boolean) => engine.setBoost(active),
    toggleMute: () => {
      sfx.setMuted(!sfx.muted);
      return sfx.muted;
    },
    togglePause: () => {
      if (engine.state === 'PLAYING') {
        engine.setState('PAUSED');
        return true;
      }
      if (engine.state === 'PAUSED') {
        engine.setState('PLAYING');
        return false;
      }
      return false;
    },
    restart: () => engine.start(),
    destroy: () => {
      engine.stopLoop();
      sfx.dispose();
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      containerEl.innerHTML = '';
    },
  };
}
