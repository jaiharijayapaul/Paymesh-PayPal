import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Distinctive PayMesh Connected Nodes & Intelligent Hex Mesh Symbol */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
          <defs>
            <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="pulseGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          
          {/* Outer Mesh Hexagon Network */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            stroke="url(#meshGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />

          {/* Intersecting Agent Neural Mesh Lattice */}
          <path d="M50 6 L50 50 L88 72" stroke="url(#meshGradient)" strokeWidth="2.5" opacity="0.6" />
          <path d="M88 28 L50 50 L12 72" stroke="url(#meshGradient)" strokeWidth="2.5" opacity="0.6" />
          <path d="M12 28 L50 50 L50 94" stroke="url(#meshGradient)" strokeWidth="2.5" opacity="0.6" />

          {/* Connected Agent Nodes */}
          <circle cx="50" cy="6" r="4.5" fill="#8b5cf6" />
          <circle cx="88" cy="28" r="4.5" fill="#a855f7" />
          <circle cx="88" cy="72" r="4.5" fill="#06b6d4" />
          <circle cx="50" cy="94" r="4.5" fill="#0891b2" />
          <circle cx="12" cy="72" r="4.5" fill="#06b6d4" />
          <circle cx="12" cy="28" r="4.5" fill="#8b5cf6" />

          {/* Central Autonomous Settlement Core Node */}
          <circle cx="50" cy="50" r="7.5" fill="url(#pulseGradient)" />
          <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-white ${textSizes[size]}`}>
            Pay<span className="text-cyan-400">Mesh</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300">
            AI Core
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Connect Intelligence. Transact Trustfully.
          </span>
        )}
      </div>
    </div>
  );
};
