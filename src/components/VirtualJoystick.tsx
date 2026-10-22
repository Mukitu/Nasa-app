import React, { useRef, useState, useCallback, useEffect } from 'react';
import { User, Move } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number, magnitude: number) => void;
  onStop: () => void;
  label?: string;
  size?: number; // Outer diameter in px
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onStop,
  label = 'ASTRONAUT EVA JOYSTICK',
  size = 128,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const maxRadius = (size / 2) - 16; // Range of knob displacement

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsActive(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const norm = clampedDist / maxRadius;

    let nx = 0;
    let ny = 0;
    if (dist > 0.001) {
      nx = (dx / dist) * norm;
      ny = -(dy / dist) * norm; // Inverted Y so up is positive
    }

    setKnobPos({
      x: dist > 0.001 ? (dx / dist) * clampedDist : 0,
      y: dist > 0.001 ? (dy / dist) * clampedDist : 0,
    });

    onMove(nx, ny, norm);
  }, [maxRadius, onMove]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const norm = clampedDist / maxRadius;

    let nx = 0;
    let ny = 0;
    if (dist > 0.001) {
      nx = (dx / dist) * norm;
      ny = -(dy / dist) * norm; // Up is forward
    }

    setKnobPos({
      x: dist > 0.001 ? (dx / dist) * clampedDist : 0,
      y: dist > 0.001 ? (dy / dist) * clampedDist : 0,
    });

    onMove(nx, ny, norm);
  }, [maxRadius, onMove]);

  const handlePointerUpOrCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback if already released
      }
      activePointerIdRef.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      onStop();
    }
  }, [onStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onStop();
    };
  }, [onStop]);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none pointer-events-auto">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className={`relative rounded-full border-2 transition-colors touch-none cursor-pointer flex items-center justify-center ${
          isActive
            ? 'border-sky-400 bg-sky-950/70 shadow-[0_0_24px_rgba(56,189,248,0.45)]'
            : 'border-sky-500/40 bg-slate-950/75 hover:border-sky-400/60 shadow-[0_0_16px_rgba(0,0,0,0.6)]'
        } backdrop-blur-md`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        aria-label="Astronaut Movement Joystick"
      >
        {/* Subtle crosshair guide ticks */}
        <div className="absolute top-1.5 w-1 h-2 bg-sky-400/50 rounded-full pointer-events-none" />
        <div className="absolute bottom-1.5 w-1 h-2 bg-sky-400/50 rounded-full pointer-events-none" />
        <div className="absolute left-1.5 h-1 w-2 bg-sky-400/50 rounded-full pointer-events-none" />
        <div className="absolute right-1.5 h-1 w-2 bg-sky-400/50 rounded-full pointer-events-none" />

        {/* Concentric subtle guide circle */}
        <div className="absolute inset-5 rounded-full border border-sky-500/20 pointer-events-none" />

        {/* Floating Thumbstick Knob */}
        <div
          className={`absolute w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
            isActive
              ? 'bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_16px_rgba(56,189,248,0.8)] border-2 border-white'
              : 'bg-gradient-to-br from-slate-700 to-slate-900 border border-sky-400/40 shadow-md'
          }`}
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            transition: isActive ? 'none' : 'transform 0.15s ease-out',
            pointerEvents: 'none',
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white/80 shadow-inner flex items-center justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-600' : 'bg-slate-700'}`} />
          </div>
        </div>
      </div>

      {label && (
        <div className="flex items-center gap-1 text-[9px] font-mono-tech uppercase tracking-wider text-sky-400/90 font-bold bg-slate-950/80 px-2 py-0.5 rounded-full border border-sky-500/30">
          <User className="w-2.5 h-2.5 text-sky-400 shrink-0" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
};
